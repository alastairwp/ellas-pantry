/**
 * Backfill egg-free dietary tag on existing recipes.
 *
 * Usage:
 *   npx tsx scripts/backfill-egg-free.ts
 *   npx tsx scripts/backfill-egg-free.ts --db-url "postgresql://user:pass@localhost:5432/db"
 *   npx tsx scripts/backfill-egg-free.ts --dry-run
 */

import { PrismaClient } from "@prisma/client";

const EGG_KEYWORDS = ["egg"];

function hasEgg(ingredientName: string): boolean {
  const lower = ingredientName.toLowerCase();
  return EGG_KEYWORDS.some((k) => new RegExp(`\\b${k}s?\\b`).test(lower));
}

async function main() {
  const args = process.argv.slice(2);
  const dbUrlIndex = args.indexOf("--db-url");
  const dbUrl =
    dbUrlIndex !== -1 ? args[dbUrlIndex + 1] : process.env.DATABASE_URL;
  const dryRun = args.includes("--dry-run");

  if (!dbUrl) {
    console.error("No database URL provided. Use --db-url or set DATABASE_URL");
    process.exit(1);
  }

  const db = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    // Ensure egg-free tag exists
    let eggFreeTag = await db.dietaryTag.findUnique({
      where: { slug: "egg-free" },
    });

    if (!eggFreeTag) {
      if (dryRun) {
        console.log("[DRY RUN] Would create egg-free DietaryTag");
      } else {
        eggFreeTag = await db.dietaryTag.create({
          data: { name: "Egg-Free", slug: "egg-free" },
        });
        console.log(`Created egg-free DietaryTag (id: ${eggFreeTag.id})`);
      }
    } else {
      console.log(`egg-free DietaryTag already exists (id: ${eggFreeTag.id})`);
    }

    const tagId = eggFreeTag?.id;

    // Fetch all recipes with their ingredients
    const recipes = await db.recipe.findMany({
      select: {
        id: true,
        title: true,
        ingredients: {
          select: { ingredient: { select: { name: true } } },
        },
        dietaryTags: {
          select: { dietaryTagId: true },
        },
      },
    });

    console.log(`\nProcessing ${recipes.length} recipes...\n`);

    let tagged = 0;
    let skippedHasEgg = 0;
    let skippedAlreadyTagged = 0;

    for (const recipe of recipes) {
      const ingredientNames = recipe.ingredients.map(
        (ri) => ri.ingredient.name
      );
      const containsEgg = ingredientNames.some(hasEgg);

      if (containsEgg) {
        skippedHasEgg++;
        continue;
      }

      // Check if already tagged
      if (tagId && recipe.dietaryTags.some((t) => t.dietaryTagId === tagId)) {
        skippedAlreadyTagged++;
        continue;
      }

      if (dryRun) {
        console.log(`[DRY RUN] Would tag: ${recipe.title}`);
        tagged++;
      } else if (tagId) {
        await db.recipeDietaryTag.create({
          data: { recipeId: recipe.id, dietaryTagId: tagId },
        });
        tagged++;
      }
    }

    console.log(`\nResults:`);
    console.log(`  Tagged as egg-free: ${tagged}`);
    console.log(`  Skipped (contains egg): ${skippedHasEgg}`);
    console.log(`  Skipped (already tagged): ${skippedAlreadyTagged}`);
    console.log(`  Total recipes: ${recipes.length}`);
    if (dryRun) console.log(`\n  (Dry run — no changes made)`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
