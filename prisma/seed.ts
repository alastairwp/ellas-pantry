import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parseMinutes(timeStr: string | undefined): number {
  if (!timeStr || !timeStr.trim()) return 0;
  let total = 0;
  const hrsMatch = timeStr.match(/(\d+)\s*hrs?/);
  const minsMatch = timeStr.match(/(\d+)\s*mins?/);
  if (hrsMatch) total += parseInt(hrsMatch[1]) * 60;
  if (minsMatch) total += parseInt(minsMatch[1]);
  return total;
}

function parseServings(servingsStr: string | undefined): number {
  if (!servingsStr) return 4;
  const num = parseInt(servingsStr);
  return isNaN(num) ? 4 : num;
}

// Map top-level cuisine paths to our categories
const CATEGORY_MAP: Record<string, string> = {
  "Breakfast and Brunch": "Breakfast",
  "Main Dishes": "Dinner",
  "Meat and Poultry": "Dinner",
  Seafood: "Dinner",
  Desserts: "Desserts",
  "Appetizers and Snacks": "Snacks",
  Salad: "Lunch",
  "Soup Recipes": "Lunch",
  "Soups, Stews and Chili Recipes": "Lunch",
  "Side Dish": "Sides",
  "Fruits and Vegetables": "Sides",
  Bread: "Baking",
  "Quick Bread Recipes": "Baking",
  "BBQ & Grilling": "Dinner",
  "Sauces and Condiments": "Sides",
  "Drinks Recipes": "Drinks",
  Mexican: "Dinner",
  Cuisine: "Dinner",
  "Everyday Cooking": "Dinner",
  "Holidays and Events Recipes": "Dinner",
  "Trusted Brands: Recipes and Tips": "Dinner",
};

// Simple vegan/vegetarian detection from ingredients
const MEAT_KEYWORDS = [
  "chicken",
  "beef",
  "pork",
  "lamb",
  "turkey",
  "bacon",
  "sausage",
  "ham",
  "steak",
  "mince",
  "ground beef",
  "ground turkey",
  "veal",
  "duck",
  "prosciutto",
  "salami",
  "pepperoni",
  "anchov",
  "shrimp",
  "prawn",
  "salmon",
  "tuna",
  "cod",
  "fish",
  "crab",
  "lobster",
  "clam",
  "mussel",
  "oyster",
  "scallop",
  "squid",
  "calamari",
];

const DAIRY_KEYWORDS = [
  "milk",
  "butter",
  "cream",
  "cheese",
  "yogurt",
  "yoghurt",
  "sour cream",
  "cream cheese",
  "whipping cream",
  "heavy cream",
  "half-and-half",
  "buttermilk",
  "ghee",
];

const EGG_KEYWORDS = ["egg"];

function detectDietaryTags(ingredients: string): string[] {
  const lower = ingredients.toLowerCase();
  const tags: string[] = [];

  const hasMeat = MEAT_KEYWORDS.some((k) => lower.includes(k));
  const hasDairy = DAIRY_KEYWORDS.some((k) => lower.includes(k));
  const hasEgg = EGG_KEYWORDS.some(
    (k) => new RegExp(`\\b${k}s?\\b`).test(lower)
  );

  if (!hasMeat && !hasDairy && !hasEgg) {
    tags.push("vegan", "vegetarian", "dairy-free");
  } else if (!hasMeat) {
    tags.push("vegetarian");
    if (!hasDairy) tags.push("dairy-free");
  } else {
    if (!hasDairy) tags.push("dairy-free");
  }

  // Gluten-free detection (rough — no flour, no bread, no pasta, no wheat)
  const glutenKeywords = [
    "flour",
    "bread",
    "pasta",
    "noodle",
    "wheat",
    "cracker",
    "crumb",
    "tortilla",
    "puff pastry",
    "pie crust",
    "pie pastry",
    "biscuit",
    "cake mix",
    "brownie mix",
    "soy sauce",
  ];
  const hasGluten = glutenKeywords.some((k) => lower.includes(k));
  if (!hasGluten) tags.push("gluten-free");

  return tags;
}

function splitIngredients(ingredientsStr: string): string[] {
  // Ingredients are comma-separated but commas also appear inside parentheses
  // and in phrases like "peeled, cored and sliced"
  // Strategy: split by comma and recombine fragments that look like notes
  const parts = ingredientsStr.split(",").map((s) => s.trim());
  const result: string[] = [];
  let current = "";

  for (const part of parts) {
    if (!current) {
      current = part;
    } else {
      // If this part starts with a number or quantity word, it's a new ingredient
      if (/^[\d½¼¾⅓⅔⅛]+/.test(part) || /^\d/.test(part)) {
        result.push(current.trim());
        current = part;
      } else {
        // It's a continuation (notes like "peeled, cored and sliced")
        current += ", " + part;
      }
    }
  }
  if (current.trim()) result.push(current.trim());

  return result.filter((s) => s.length > 0);
}

function splitDirections(directionsStr: string): string[] {
  // Split by newlines, filter out empty lines and photo credits
  return directionsStr
    .split("\n")
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 10 &&
        !s.toLowerCase().startsWith("photo by") &&
        !s.toLowerCase().startsWith("recipe by") &&
        !/^[a-z]+ [a-z]+$/i.test(s) // filter standalone names
    );
}

async function main() {
  console.log("Reading CSV...");
  const csvPath = path.join(__dirname, "../docs/recipes.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  console.log(`Found ${records.length} recipes in CSV`);

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.recipeDietaryTag.deleteMany();
  await prisma.recipeCategory.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.dietaryTag.deleteMany();
  await prisma.category.deleteMany();

  // Create dietary tags
  console.log("Creating dietary tags...");
  const dietaryTags = await Promise.all(
    [
      { name: "Vegan", slug: "vegan" },
      { name: "Vegetarian", slug: "vegetarian" },
      { name: "Gluten-Free", slug: "gluten-free" },
      { name: "Dairy-Free", slug: "dairy-free" },
      { name: "Nut-Free", slug: "nut-free" },
    ].map((tag) => prisma.dietaryTag.create({ data: tag }))
  );
  const tagMap = Object.fromEntries(
    dietaryTags.map((t: { slug: string; id: number }) => [t.slug, t.id])
  );

  // Create categories
  console.log("Creating categories...");
  const categoryData = [
    {
      name: "Breakfast",
      slug: "breakfast",
      description: "Start your day right",
    },
    { name: "Lunch", slug: "lunch", description: "Midday meals and soups" },
    {
      name: "Dinner",
      slug: "dinner",
      description: "Hearty evening recipes",
    },
    {
      name: "Desserts",
      slug: "desserts",
      description: "Sweet treats and bakes",
    },
    {
      name: "Snacks",
      slug: "snacks",
      description: "Light bites and appetisers",
    },
    { name: "Sides", slug: "sides", description: "Side dishes and extras" },
    { name: "Baking", slug: "baking", description: "Breads, cakes, and more" },
    { name: "Drinks", slug: "drinks", description: "Beverages and smoothies" },
  ];

  const categories = await Promise.all(
    categoryData.map((cat) => prisma.category.create({ data: cat }))
  );
  const catMap = Object.fromEntries(
    categories.map((c: { slug: string; id: number }) => [c.slug, c.id])
  );

  // Track unique ingredients
  const ingredientCache = new Map<string, number>();

  async function getOrCreateIngredient(name: string): Promise<number> {
    const normalized = name.toLowerCase().trim().slice(0, 200);
    if (ingredientCache.has(normalized)) {
      return ingredientCache.get(normalized)!;
    }
    const ingredient = await prisma.ingredient.create({
      data: { name: normalized },
    });
    ingredientCache.set(normalized, ingredient.id);
    return ingredient.id;
  }

  // Process recipes
  const usedSlugs = new Set<string>();
  let imported = 0;
  let skipped = 0;

  interface CsvRecord {
    recipe_name?: string;
    ingredients?: string;
    directions?: string;
    img_src?: string;
    prep_time?: string;
    cook_time?: string;
    servings?: string;
    cuisine_path?: string;
  }

  for (const record of records as CsvRecord[]) {
    const name = record.recipe_name?.trim();
    const ingredientsStr = record.ingredients?.trim();
    const directionsStr = record.directions?.trim();
    const imgSrc = record.img_src?.trim();

    if (!name || !ingredientsStr || !directionsStr) {
      skipped++;
      continue;
    }

    // Generate unique slug
    let slug = slugify(name);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${imported}`;
    }
    if (usedSlugs.has(slug)) {
      skipped++;
      continue;
    }
    usedSlugs.add(slug);

    const prepTime = parseMinutes(record.prep_time);
    const cookTime = parseMinutes(record.cook_time);
    const servings = parseServings(record.servings);
    const cuisinePath = record.cuisine_path?.trim() || "";
    const topCategory = cuisinePath.replace(/^\//, "").split("/")[0] || "";
    const categoryName = CATEGORY_MAP[topCategory] || "Dinner";
    const categorySlug = categoryName.toLowerCase();

    try {
      // Create recipe
      const recipe = await prisma.recipe.create({
        data: {
          slug,
          title: name,
          description:
            directionsStr.split(/[.!]\s/)[0].slice(0, 200) +
            (directionsStr.length > 200 ? "..." : ""),
          heroImage: imgSrc || "/images/recipes/placeholder.jpg",
          prepTime,
          cookTime,
          servings,
          difficulty:
            prepTime + cookTime > 60
              ? "Hard"
              : prepTime + cookTime > 30
                ? "Medium"
                : "Easy",
        },
      });

      // Create ingredients
      const ingredientsList = splitIngredients(ingredientsStr);
      for (let i = 0; i < ingredientsList.length; i++) {
        const ingText = ingredientsList[i];
        const ingredientId = await getOrCreateIngredient(ingText);
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId,
            quantity: ingText,
            orderIndex: i,
          },
        });
      }

      // Create steps
      const steps = splitDirections(directionsStr);
      for (let i = 0; i < steps.length; i++) {
        await prisma.recipeStep.create({
          data: {
            recipeId: recipe.id,
            stepNumber: i + 1,
            instruction: steps[i],
          },
        });
      }

      // Assign category
      if (catMap[categorySlug]) {
        await prisma.recipeCategory.create({
          data: {
            recipeId: recipe.id,
            categoryId: catMap[categorySlug],
          },
        });
      }

      // Assign dietary tags
      const detectedTags = detectDietaryTags(ingredientsStr);
      for (const tagSlug of detectedTags) {
        if (tagMap[tagSlug]) {
          await prisma.recipeDietaryTag.create({
            data: {
              recipeId: recipe.id,
              dietaryTagId: tagMap[tagSlug],
            },
          });
        }
      }

      imported++;
      if (imported % 100 === 0) {
        console.log(`  Imported ${imported} recipes...`);
      }
    } catch (err) {
      skipped++;
      if (skipped <= 5) {
        console.warn(`  Skipped "${name}":`, (err as Error).message);
      }
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`  Imported: ${imported} recipes`);
  console.log(`  Skipped: ${skipped} recipes`);
  console.log(`  Dietary tags: ${dietaryTags.length}`);
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Unique ingredients: ${ingredientCache.size}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
