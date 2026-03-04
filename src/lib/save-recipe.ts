import { prisma } from "./prisma";
import { slugify } from "./utils";
import type { GeneratedRecipe } from "./generate-recipe";

/**
 * Save a generated recipe to the database.
 * Handles ingredient upsert, step creation, and tag/category linking.
 */
export async function saveGeneratedRecipe(
  recipe: GeneratedRecipe,
  imageUrl: string
): Promise<{ id: number; slug: string } | null> {
  try {
    let slug = slugify(recipe.title);

    // Check for duplicate slug
    const existing = await prisma.recipe.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Resolve dietary tag IDs
    const dietaryTagRecords = await Promise.all(
      recipe.dietaryTags.map((name) =>
        prisma.dietaryTag.findFirst({
          where: { name: { equals: name } },
        })
      )
    );
    const validDietaryTagIds = dietaryTagRecords
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map((t) => t.id);

    // Resolve category IDs
    const categoryRecords = await Promise.all(
      recipe.categories.map((name) =>
        prisma.category.findFirst({
          where: { name: { equals: name } },
        })
      )
    );
    const validCategoryIds = categoryRecords
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => c.id);

    // Upsert ingredients and collect IDs
    const ingredientData = await Promise.all(
      recipe.ingredients.map(async (ing, index) => {
        const ingredient = await prisma.ingredient.upsert({
          where: { name: ing.name.toLowerCase().trim() },
          update: {},
          create: { name: ing.name.toLowerCase().trim() },
        });
        return {
          ingredientId: ingredient.id,
          quantity: ing.quantity,
          unit: ing.unit || null,
          notes: ing.notes || null,
          orderIndex: index,
        };
      })
    );

    // Deduplicate ingredients by ingredientId (keep first occurrence)
    const seen = new Set<number>();
    const uniqueIngredientData = ingredientData.filter((ing) => {
      if (seen.has(ing.ingredientId)) return false;
      seen.add(ing.ingredientId);
      return true;
    });

    const saved = await prisma.recipe.create({
      data: {
        slug,
        title: recipe.title,
        description: recipe.description,
        heroImage: imageUrl,
        source: "ai",
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ...(recipe.nutrition && {
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          carbs: recipe.nutrition.carbs,
          fat: recipe.nutrition.fat,
          fiber: recipe.nutrition.fiber,
          sugar: recipe.nutrition.sugar,
          nutritionEstimatedAt: new Date(),
        }),
        ingredients: {
          create: uniqueIngredientData,
        },
        steps: {
          create: recipe.steps.map((step, index) => ({
            stepNumber: index + 1,
            instruction: step.instruction,
            tipText: step.tipText || null,
          })),
        },
        dietaryTags: {
          create: validDietaryTagIds.map((id) => ({ dietaryTagId: id })),
        },
        categories: {
          create: validCategoryIds.map((id) => ({ categoryId: id })),
        },
      },
    });

    return { id: saved.id, slug: saved.slug };
  } catch (error) {
    console.error(`Failed to save recipe "${recipe.title}":`, error);
    return null;
  }
}
