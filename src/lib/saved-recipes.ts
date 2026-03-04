import { prisma } from "./prisma";

const SAVED_RECIPES_PER_PAGE = 12;

export async function getSavedRecipes(userId: string, page = 1) {
  const [savedRecipes, total] = await Promise.all([
    prisma.savedRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * SAVED_RECIPES_PER_PAGE,
      take: SAVED_RECIPES_PER_PAGE,
      include: {
        recipe: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            heroImage: true,
            prepTime: true,
            cookTime: true,
            published: true,
            dietaryTags: {
              include: { dietaryTag: { select: { name: true, slug: true } } },
            },
            categories: {
              include: { category: { select: { name: true, slug: true } } },
            },
          },
        },
      },
    }),
    prisma.savedRecipe.count({ where: { userId } }),
  ]);

  const recipes = savedRecipes
    .filter((sr) => sr.recipe.published)
    .map((sr) => sr.recipe);

  return {
    recipes,
    total,
    totalPages: Math.ceil(total / SAVED_RECIPES_PER_PAGE),
    page,
  };
}
