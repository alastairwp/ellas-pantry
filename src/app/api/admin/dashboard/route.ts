import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const [
    totalRecipes,
    publishedRecipes,
    unpublishedRecipes,
    recipesAwaitingImages,
    recipesAwaitingIntros,
    totalUsers,
    activeUsers,
    totalRatings,
    totalReviews,
    totalSavedRecipes,
    totalCollections,
    categoryCounts,
    dietaryTagCounts,
    recentRecipes,
    sourceBreakdown,
    difficultyBreakdown,
    avgRating,
    topRatedRecipes,
    recipesThisWeek,
    usersThisWeek,
    reviewsThisWeek,
  ] = await Promise.all([
    // Recipe counts
    prisma.recipe.count(),
    prisma.recipe.count({ where: { published: true } }),
    prisma.recipe.count({ where: { published: false } }),
    prisma.recipe.count({ where: { imageStatus: "pending" } }),
    prisma.recipe.count({
      where: { published: true, source: "ai", introGeneratedAt: null },
    }),

    // User counts
    prisma.user.count(),
    prisma.session.groupBy({
      by: ["userId"],
      where: { expires: { gte: oneMonthAgo } },
    }).then((r) => r.length),

    // Engagement counts
    prisma.rating.count(),
    prisma.review.count(),
    prisma.savedRecipe.count(),
    prisma.collection.count(),

    // Recipes per category
    prisma.recipeCategory.groupBy({
      by: ["categoryId"],
      _count: { categoryId: true },
    }).then(async (groups) => {
      const categories = await prisma.category.findMany();
      const catMap = new Map(categories.map((c) => [c.id, c.name]));
      return groups
        .map((g) => ({
          name: catMap.get(g.categoryId) || "Unknown",
          count: g._count.categoryId,
        }))
        .sort((a, b) => b.count - a.count);
    }),

    // Recipes per dietary tag
    prisma.recipeDietaryTag.groupBy({
      by: ["dietaryTagId"],
      _count: { dietaryTagId: true },
    }).then(async (groups) => {
      const tags = await prisma.dietaryTag.findMany();
      const tagMap = new Map(tags.map((t) => [t.id, t.name]));
      return groups
        .map((g) => ({
          name: tagMap.get(g.dietaryTagId) || "Unknown",
          count: g._count.dietaryTagId,
        }))
        .sort((a, b) => b.count - a.count);
    }),

    // Recent recipes (last 7 days)
    prisma.recipe.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),

    // Source breakdown
    prisma.recipe.groupBy({
      by: ["source"],
      _count: true,
    }),

    // Difficulty breakdown
    prisma.recipe.groupBy({
      by: ["difficulty"],
      where: { published: true },
      _count: true,
    }),

    // Average rating
    prisma.rating.aggregate({ _avg: { score: true } }),

    // Top rated recipes
    prisma.recipe.findMany({
      where: { published: true },
      select: {
        title: true,
        slug: true,
        _count: { select: { ratings: true } },
      },
      orderBy: { ratings: { _count: "desc" } },
      take: 5,
    }),

    // Recipes created this week
    prisma.recipe.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),

    // Users joined this week
    prisma.user.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),

    // Reviews this week
    prisma.review.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return NextResponse.json({
    recipes: {
      total: totalRecipes,
      published: publishedRecipes,
      unpublished: unpublishedRecipes,
      awaitingImages: recipesAwaitingImages,
      awaitingIntros: recipesAwaitingIntros,
      thisWeek: recipesThisWeek,
    },
    users: {
      total: totalUsers,
      activeLastMonth: activeUsers,
      thisWeek: usersThisWeek,
    },
    engagement: {
      ratings: totalRatings,
      reviews: totalReviews,
      savedRecipes: totalSavedRecipes,
      collections: totalCollections,
      avgRating: avgRating._avg.score ? Number(avgRating._avg.score.toFixed(1)) : 0,
      reviewsThisWeek,
    },
    categoryCounts,
    dietaryTagCounts,
    sourceBreakdown: sourceBreakdown.map((s) => ({
      source: s.source || "unknown",
      count: s._count,
    })),
    difficultyBreakdown: difficultyBreakdown.map((d) => ({
      difficulty: d.difficulty || "unset",
      count: d._count,
    })),
    topRatedRecipes: topRatedRecipes.map((r) => ({
      title: r.title,
      slug: r.slug,
      ratingCount: r._count.ratings,
    })),
  });
}
