import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { estimateNutrition } from "@/lib/estimate-nutrition";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const missing = await prisma.recipe.count({
    where: { published: true, nutritionEstimatedAt: null },
  });
  const total = await prisma.recipe.count({ where: { published: true } });

  return NextResponse.json({ missing, total });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const { count = 10 } = await request.json();

  const recipes = await prisma.recipe.findMany({
    where: { published: true, nutritionEstimatedAt: null },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
    },
    take: Math.min(count, 50),
  });

  let processed = 0;
  const errors: string[] = [];

  for (const recipe of recipes) {
    try {
      const ingredientInputs = recipe.ingredients.map((ri) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      }));

      const nutrition = await estimateNutrition(
        ingredientInputs,
        recipe.servings
      );

      await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          sugar: nutrition.sugar,
          nutritionEstimatedAt: new Date(),
        },
      });

      processed++;
    } catch (err) {
      errors.push(
        `${recipe.title}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return NextResponse.json({ processed, errors });
}
