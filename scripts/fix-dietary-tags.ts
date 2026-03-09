import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { filterInvalidDietaryTags } from "../src/lib/dietary-validation";

const dbUrlArg = process.argv.find((a) => a.startsWith("--db-url="));
if (dbUrlArg) {
  process.env.DATABASE_URL = dbUrlArg.split("=").slice(1).join("=");
}

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");

  if (!apply) {
    console.log("DRY RUN — pass --apply to commit changes\n");
  }

  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: { include: { ingredient: true } },
      dietaryTags: { include: { dietaryTag: true } },
    },
  });

  let totalRemoved = 0;
  let recipesAffected = 0;

  for (const recipe of recipes) {
    const ingredientNames = recipe.ingredients.map(
      (ri) => ri.ingredient.name
    );
    const currentSlugs = recipe.dietaryTags.map(
      (rt) => rt.dietaryTag.slug
    );

    const validSlugs = filterInvalidDietaryTags(ingredientNames, currentSlugs);
    const removedSlugs = currentSlugs.filter((s) => !validSlugs.includes(s));

    if (removedSlugs.length === 0) continue;

    recipesAffected++;
    totalRemoved += removedSlugs.length;

    const contradictions = removedSlugs.join(", ");
    console.log(
      `[${recipe.id}] "${recipe.title}" — removing: ${contradictions}`
    );
    console.log(`       Ingredients: ${ingredientNames.slice(0, 5).join(", ")}${ingredientNames.length > 5 ? "..." : ""}`);

    if (apply) {
      const removedTagIds = recipe.dietaryTags
        .filter((rt) => removedSlugs.includes(rt.dietaryTag.slug))
        .map((rt) => rt.dietaryTagId);

      await prisma.recipeDietaryTag.deleteMany({
        where: {
          recipeId: recipe.id,
          dietaryTagId: { in: removedTagIds },
        },
      });
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Recipes affected: ${recipesAffected}`);
  console.log(`  Tags removed: ${totalRemoved}`);
  if (!apply) {
    console.log(`\nRun with --apply to commit these changes.`);
  } else {
    console.log(`\nChanges applied successfully.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
