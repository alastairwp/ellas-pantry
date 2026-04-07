import { prisma } from "./prisma";
import type { RecipeFilters } from "@/types/recipe";
import { ALLERGY_TO_DIETARY_TAG, type AllergyType } from "@/lib/allergies";

const recipeIncludes = {
  ingredients: {
    include: { ingredient: true },
    orderBy: { orderIndex: "asc" as const },
  },
  steps: {
    orderBy: { stepNumber: "asc" as const },
  },
  dietaryTags: {
    include: { dietaryTag: true },
  },
  categories: {
    include: { category: true },
  },
  occasions: {
    include: { occasion: true },
  },
};

const recipeCardSelect = {
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
};

async function withRatingStats<T extends { id: number }>(recipes: T[]) {
  if (recipes.length === 0) return recipes.map((r) => ({ ...r, ratingAverage: 0, ratingCount: 0 }));

  const recipeIds = recipes.map((r) => r.id);
  const ratings = await prisma.rating.groupBy({
    by: ["recipeId"],
    where: { recipeId: { in: recipeIds } },
    _avg: { score: true },
    _count: { score: true },
  });

  const ratingMap = new Map(
    ratings.map((r) => [r.recipeId, { avg: r._avg.score || 0, count: r._count.score }])
  );

  return recipes.map((recipe) => {
    const stats = ratingMap.get(recipe.id);
    return {
      ...recipe,
      ratingAverage: stats ? Math.round(stats.avg * 10) / 10 : 0,
      ratingCount: stats?.count || 0,
    };
  });
}

export async function getRecipeBySlug(slug: string, includeUnpublished = false) {
  const recipe = await prisma.recipe.findUnique({
    where: { slug, ...(includeUnpublished ? {} : { published: true }) },
    include: recipeIncludes,
  });

  if (!recipe) return null;

  const ratingStats = await prisma.rating.aggregate({
    where: { recipeId: recipe.id },
    _avg: { score: true },
    _count: { score: true },
  });

  return {
    ...recipe,
    ratingAverage: Math.round((ratingStats._avg.score || 0) * 10) / 10,
    ratingCount: ratingStats._count.score,
  };
}

export async function getRecipes(filters: RecipeFilters = {}) {
  const {
    query, dietary, category, occasion,
    difficulty, maxCookTime, ingredient, sort,
    page = 1, limit = 12, excludeAllergens,
  } = filters;

  const where: Record<string, unknown> = { published: true };

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
    ];
  }

  if (dietary && dietary.length > 0) {
    where.dietaryTags = {
      some: {
        dietaryTag: {
          slug: { in: dietary },
        },
      },
    };
  }

  if (category) {
    where.categories = {
      some: {
        category: {
          slug: category,
        },
      },
    };
  }

  if (occasion) {
    where.occasions = {
      some: {
        occasion: {
          slug: occasion,
        },
      },
    };
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (maxCookTime) {
    where.cookTime = { lte: maxCookTime };
  }

  if (ingredient) {
    where.ingredients = {
      some: {
        ingredient: {
          name: { contains: ingredient },
        },
      },
    };
  }

  if (excludeAllergens && excludeAllergens.length > 0) {
    const requiredTags = excludeAllergens
      .map((a) => ALLERGY_TO_DIETARY_TAG[a as AllergyType])
      .filter(Boolean);
    if (requiredTags.length > 0) {
      where.AND = [
        ...((where.AND as unknown[]) || []),
        ...requiredTags.map((slug) => ({
          dietaryTags: { some: { dietaryTag: { slug } } },
        })),
      ];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any;
  switch (sort) {
    case "quickest":
      orderBy = { cookTime: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "popular":
    default:
      orderBy = { popularity: { compositeScore: "desc" } };
  }

  const [rawRecipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      select: recipeCardSelect,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);

  let recipes = await withRatingStats(rawRecipes);

  if (sort === "rating") {
    recipes = recipes.sort((a, b) => b.ratingAverage - a.ratingAverage);
  }

  return {
    recipes,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

export async function getFeaturedRecipes(count = 6) {
  const rawRecipes = await prisma.recipe.findMany({
    where: { published: true },
    select: recipeCardSelect,
    orderBy: { popularity: { compositeScore: "desc" } },
    take: count,
  });

  return withRatingStats(rawRecipes);
}

export async function getRelatedRecipes(
  slug: string,
  categoryIds: number[],
  dietaryTagIds: number[] = [],
  count = 3
) {
  // Fetch candidates sharing categories OR dietary tags
  const rawRecipes = await prisma.recipe.findMany({
    where: {
      published: true,
      slug: { not: slug },
      OR: [
        ...(categoryIds.length > 0
          ? [{ categories: { some: { categoryId: { in: categoryIds } } } }]
          : []),
        ...(dietaryTagIds.length > 0
          ? [{ dietaryTags: { some: { dietaryTagId: { in: dietaryTagIds } } } }]
          : []),
      ],
    },
    select: recipeCardSelect,
    orderBy: { popularity: { compositeScore: "desc" } },
    take: count * 2,
  });

  let results = rawRecipes.slice(0, count);

  // Backfill with popular recipes if not enough matches
  if (results.length < count) {
    const existingSlugs = [slug, ...results.map((r) => r.slug)];
    const backfill = await prisma.recipe.findMany({
      where: {
        published: true,
        slug: { notIn: existingSlugs },
      },
      select: recipeCardSelect,
      orderBy: { popularity: { compositeScore: "desc" } },
      take: count - results.length,
    });
    results = [...results, ...backfill];
  }

  return withRatingStats(results);
}

export async function getRecipeOfTheDay() {
  const today = new Date().toISOString().slice(0, 10); // "2026-03-04"
  const seed = [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = await prisma.recipe.count({ where: { published: true } });
  if (count === 0) return null;
  const skip = seed % count;
  const [recipe] = await prisma.recipe.findMany({
    where: { published: true },
    select: recipeCardSelect,
    skip,
    take: 1,
  });
  return recipe ? (await withRatingStats([recipe]))[0] : null;
}

export async function getAllRecipeSlugs() {
  return prisma.recipe.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });
}
