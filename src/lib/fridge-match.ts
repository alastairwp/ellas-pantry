import { prisma } from "@/lib/prisma";

export async function matchRecipesByIngredientIds(matchedIds: number[]) {
  if (matchedIds.length === 0) return [];

  const recipes = await prisma.recipe.findMany({
    where: {
      published: true,
      ingredients: {
        some: { ingredientId: { in: matchedIds } },
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      heroImage: true,
      prepTime: true,
      cookTime: true,
      dietaryTags: {
        include: { dietaryTag: { select: { name: true, slug: true } } },
      },
      categories: {
        include: { category: { select: { name: true, slug: true } } },
      },
      ingredients: {
        select: { ingredientId: true },
      },
    },
  });

  const matchedIdSet = new Set(matchedIds);
  return recipes
    .map((recipe) => {
      const totalIngredients = recipe.ingredients.length;
      const matchCount = recipe.ingredients.filter((i) =>
        matchedIdSet.has(i.ingredientId)
      ).length;
      const missingCount = totalIngredients - matchCount;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ingredients: _, ...recipeCard } = recipe;
      return { ...recipeCard, matchCount, totalIngredients, missingCount };
    })
    .sort((a, b) => {
      if (a.matchCount !== b.matchCount) return b.matchCount - a.matchCount;
      return a.missingCount - b.missingCount;
    })
    .slice(0, 30);
}

export async function matchIngredientNames(names: string[]) {
  const matched = await prisma.ingredient.findMany({
    where: {
      OR: names.map((name) => ({
        name: { contains: name.toLowerCase() },
      })),
    },
    select: { id: true, name: true },
  });
  return matched;
}
