/**
 * Import external recipes into the main Recipe table.
 *
 * Takes scraped ExternalRecipe entries that have full data (ingredients + instructions)
 * and converts them into proper internal Recipe records with:
 *   - AI-generated intro (same style as other recipes)
 *   - imageStatus "pending" (queued for SDXL generation, no external images used)
 *   - Source attribution back to the original site
 *   - Deduplication via fuzzy title matching against existing recipes
 *
 * Usage:
 *   npx tsx scripts/import-external-recipes.ts [options]
 *
 * Options:
 *   --count N        Max recipes to import (default: 50)
 *   --site NAME      Only import from a specific source site
 *   --min-rating N   Minimum rating to import (default: 3.5)
 *   --dry-run        Preview without writing to the database
 *   --skip-intros    Skip AI intro generation (use original description)
 */

import { PrismaClient } from "@prisma/client";
import { titleWords, jaccard } from "../src/lib/similarity";
import { slugify } from "../src/lib/utils";
import {
  filterInvalidDietaryTags,
  MEAT_KEYWORDS,
  DAIRY_KEYWORDS,
  EGG_KEYWORDS,
  HONEY_KEYWORDS,
  GLUTEN_KEYWORDS,
  NUT_KEYWORDS,
} from "../src/lib/dietary-validation";

const prisma = new PrismaClient();

// ── CLI args ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let count = 50;
  let site: string | null = null;
  let minRating = 3.5;
  let dryRun = false;
  let skipIntros = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) { count = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--site" && args[i + 1]) { site = args[i + 1]; i++; }
    if (args[i] === "--min-rating" && args[i + 1]) { minRating = parseFloat(args[i + 1]); i++; }
    if (args[i] === "--dry-run") dryRun = true;
    if (args[i] === "--skip-intros") skipIntros = true;
  }

  return { count, site, minRating, dryRun, skipIntros };
}

// ── Ingredient parsing ───────────────────────────────────────────────

interface ParsedIngredient {
  name: string;
  quantity: string;
  unit: string | null;
  notes: string | null;
}

const UNIT_PATTERN =
  /^([\d\u00bc-\u00be\u2150-\u215e\/\s.]+)?\s*(g|kg|ml|l|litre|litres|liter|liters|oz|lb|cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|bunch|bunches|clove|cloves|handful|handfuls|pinch|slice|slices|piece|pieces|sprig|sprigs|cm|inch|can|cans|pack|packs|packet|packets|tin|tins|sheet|sheets|rasher|rashers|fillet|fillets|knob|drop|drops|bag|bags|block|blocks|head|heads|stick|sticks|stalk|stalks|large|medium|small)\b\s*/i;

function parseIngredientString(raw: string): ParsedIngredient {
  let text = raw.trim();

  // Try to split on quantity + unit
  const match = text.match(UNIT_PATTERN);
  if (match && match[0].trim()) {
    const quantity = (match[1] || "1").trim();
    const unit = match[2] || null;
    let rest = text.slice(match[0].length).trim();

    // Extract parenthetical notes
    let notes: string | null = null;
    const notesMatch = rest.match(/[,(]\s*(.+?)\s*\)?$/);
    if (notesMatch) {
      notes = notesMatch[1];
      rest = rest.slice(0, notesMatch.index).trim();
    }

    return { name: rest || text, quantity, unit, notes };
  }

  // Fallback: just treat as a name with quantity "1"
  let notes: string | null = null;
  const notesMatch = text.match(/[,(]\s*(.+?)\s*\)?$/);
  if (notesMatch) {
    notes = notesMatch[1];
    text = text.slice(0, notesMatch.index).trim();
  }

  return { name: text, quantity: "1", unit: null, notes };
}

// ── Dietary tag inference ────────────────────────────────────────────

function inferDietaryTags(ingredientNames: string[]): string[] {
  const tags: string[] = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Egg-Free"];
  const slugs = ["vegan", "vegetarian", "gluten-free", "dairy-free", "nut-free", "egg-free"];
  const validSlugs = filterInvalidDietaryTags(ingredientNames, slugs);
  return tags.filter((_, i) => validSlugs.includes(slugs[i]));
}

// ── Category mapping ─────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string[]> = {
  Breakfast: ["breakfast", "brunch", "morning", "porridge", "oatmeal", "pancake", "waffle", "eggs benedict", "granola"],
  Lunch: ["lunch", "sandwich", "wrap", "light meal", "light bite"],
  Dinner: ["dinner", "main", "main course", "supper", "entree", "roast", "stew", "casserole", "curry", "pie"],
  Desserts: ["dessert", "pudding", "sweet", "cake", "tart", "chocolate", "ice cream", "brownie", "cheesecake"],
  Snacks: ["snack", "appetizer", "appetiser", "starter", "canape", "dip", "nibble"],
  Sides: ["side", "side dish", "accompaniment", "vegetable side"],
  Baking: ["baking", "bake", "bread", "pastry", "scone", "muffin", "cookie", "biscuit"],
  Drinks: ["drink", "beverage", "cocktail", "smoothie", "juice", "shake"],
  Soups: ["soup", "broth", "chowder", "bisque", "gazpacho"],
  Salads: ["salad", "slaw", "coleslaw"],
};

function inferCategories(externalCategories: string[], title: string): string[] {
  const matched = new Set<string>();
  const searchText = [...externalCategories, title.toLowerCase()].join(" ");

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      matched.add(category);
    }
  }

  // Default to Dinner if nothing matched
  if (matched.size === 0) matched.add("Dinner");
  return [...matched];
}

// ── Difficulty inference ─────────────────────────────────────────────

function inferDifficulty(prepTime: number | null, cookTime: number | null, stepCount: number): string {
  const total = (prepTime || 0) + (cookTime || 0);
  if (total <= 20 && stepCount <= 5) return "Easy";
  if (total >= 90 || stepCount >= 10) return "Hard";
  return "Medium";
}

// ── Source site display names ────────────────────────────────────────

const SITE_NAMES: Record<string, string> = {
  bbcgoodfood: "BBC Good Food",
  delicious: "Delicious Magazine",
  simplyrecipes: "Simply Recipes",
  foodcom: "Food.com",
  loveandlemons: "Love and Lemons",
};

// ── Main import ──────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (opts.dryRun) console.log("*** DRY RUN MODE — no database writes ***\n");

  // Load generateIntroduction lazily (requires ANTHROPIC_API_KEY)
  let generateIntroduction: typeof import("../src/lib/generate-introduction")["generateIntroduction"] | null = null;
  if (!opts.skipIntros && !opts.dryRun) {
    try {
      const mod = await import("../src/lib/generate-introduction");
      generateIntroduction = mod.generateIntroduction;
    } catch (err) {
      console.warn("Could not load intro generator (missing ANTHROPIC_API_KEY?). Will use original descriptions.");
    }
  }

  // Fetch candidates: external recipes with full data that haven't been imported yet
  const where: any = {
    importedAt: null,
    ingredients: { not: null },
    instructions: { not: null },
  };
  if (opts.site) where.sourceSite = opts.site;
  if (opts.minRating > 0) {
    where.ratingValue = { gte: opts.minRating };
    where.ratingCount = { gte: 5 };
  }

  const candidates = await prisma.externalRecipe.findMany({
    where,
    orderBy: [{ ratingCount: "desc" }, { ratingValue: "desc" }],
    take: opts.count * 3, // fetch extra to account for dedup filtering
  });

  console.log(`Found ${candidates.length} candidates (site: ${opts.site || "all"}, min rating: ${opts.minRating})`);

  if (candidates.length === 0) {
    console.log("No external recipes with full data to import. Run the scraper first to backfill recipe data.");
    await prisma.$disconnect();
    return;
  }

  // Load existing recipe titles for dedup
  const existing = await prisma.recipe.findMany({
    select: { title: true },
  });
  const existingTitleSets = existing.map((r) => titleWords(r.title));

  // Load category and dietary tag lookups
  const allCategories = await prisma.category.findMany();
  const catByName = new Map(allCategories.map((c) => [c.name, c.id]));

  const allDietaryTags = await prisma.dietaryTag.findMany();
  const tagByName = new Map(allDietaryTags.map((t) => [t.name, t.id]));

  let imported = 0;
  let skippedDuplicates = 0;
  let skippedIncomplete = 0;
  let errors = 0;

  for (const ext of candidates) {
    if (imported >= opts.count) break;

    // Parse stored JSON arrays
    const rawIngredients = ext.ingredients as string[] | null;
    const rawInstructions = ext.instructions as string[] | null;

    if (!rawIngredients?.length || !rawInstructions?.length) {
      skippedIncomplete++;
      continue;
    }

    // Dedup: skip if a similar recipe already exists
    const extWords = titleWords(ext.title);
    const isDuplicate = existingTitleSets.some((existing) => jaccard(extWords, existing) >= 0.4);
    if (isDuplicate) {
      skippedDuplicates++;
      continue;
    }

    if (opts.dryRun) {
      const siteName = SITE_NAMES[ext.sourceSite] || ext.sourceSite;
      console.log(`  [WOULD IMPORT] "${ext.title}" from ${siteName} (${rawIngredients.length} ingredients, ${rawInstructions.length} steps)`);
      imported++;
      existingTitleSets.push(extWords); // prevent dry-run duplicates
      continue;
    }

    try {
      // Parse ingredients
      const parsedIngredients = rawIngredients.map(parseIngredientString);

      // Infer metadata
      const ingredientNames = parsedIngredients.map((i) => i.name);
      const dietaryTagNames = inferDietaryTags(ingredientNames);
      const categoryNames = inferCategories(ext.categories, ext.title);
      const difficulty = inferDifficulty(ext.prepTime, ext.cookTime, rawInstructions.length);

      // Generate slug
      let slug = slugify(ext.title);
      const existingBySlug = await prisma.recipe.findUnique({ where: { slug } });
      if (existingBySlug) slug = `${slug}-${Date.now()}`;

      // Resolve category IDs
      const categoryIds = categoryNames
        .map((name) => catByName.get(name))
        .filter((id): id is number => id != null);

      // Resolve dietary tag IDs
      const dietaryTagIds = dietaryTagNames
        .map((name) => tagByName.get(name))
        .filter((id): id is number => id != null);

      // Upsert ingredients and collect data
      const ingredientData = await Promise.all(
        parsedIngredients.map(async (ing, index) => {
          const ingredient = await prisma.ingredient.upsert({
            where: { name: ing.name.toLowerCase().trim() },
            update: {},
            create: { name: ing.name.toLowerCase().trim() },
          });
          return {
            ingredientId: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
            orderIndex: index,
          };
        })
      );

      // Deduplicate ingredients by ingredientId
      const seen = new Set<number>();
      const uniqueIngredientData = ingredientData.filter((ing) => {
        if (seen.has(ing.ingredientId)) return false;
        seen.add(ing.ingredientId);
        return true;
      });

      // Source attribution
      const siteName = SITE_NAMES[ext.sourceSite] || ext.sourceSite;
      const attribution = `Originally from ${siteName}`;
      const description = ext.description || attribution;

      // Create recipe
      const saved = await prisma.recipe.create({
        data: {
          slug,
          title: ext.title,
          description,
          heroImage: "",
          source: "external",
          published: false,
          imageStatus: "pending",
          prepTime: ext.prepTime || 15,
          cookTime: ext.cookTime || 30,
          servings: ext.servings || 4,
          difficulty,
          ingredients: {
            create: uniqueIngredientData,
          },
          steps: {
            create: rawInstructions
              .filter((s) => s.trim())
              .map((instruction, index) => ({
                stepNumber: index + 1,
                instruction: instruction.trim(),
                tipText: null,
              })),
          },
          dietaryTags: {
            create: dietaryTagIds.map((id) => ({ dietaryTagId: id })),
          },
          categories: {
            create: categoryIds.map((id) => ({ categoryId: id })),
          },
        },
      });

      // Generate intro in our style
      if (generateIntroduction) {
        try {
          const intro = await generateIntroduction(
            ext.title,
            parsedIngredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
            })),
            ext.prepTime || 15,
            ext.cookTime || 30
          );
          await prisma.recipe.update({
            where: { id: saved.id },
            data: {
              description: intro,
              introGeneratedAt: new Date(),
            },
          });
        } catch (introErr) {
          console.warn(`  Intro generation failed for "${ext.title}", keeping fallback description`);
        }
      }

      // Mark as imported
      await prisma.externalRecipe.update({
        where: { id: ext.id },
        data: { importedAt: new Date() },
      });

      imported++;
      existingTitleSets.push(extWords);
      console.log(`  [${imported}/${opts.count}] Imported: "${ext.title}" (ID: ${saved.id}, slug: ${saved.slug})`);

    } catch (err) {
      console.error(`  Failed to import "${ext.title}":`, err);
      errors++;
    }
  }

  console.log(`\nDone. Imported: ${imported}, Skipped (duplicate): ${skippedDuplicates}, Skipped (incomplete): ${skippedIncomplete}, Errors: ${errors}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  prisma.$disconnect();
  process.exit(1);
});
