import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { generateIntroduction } from "@/lib/generate-introduction";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const missing = await prisma.recipe.count({
    where: { published: true, source: "ai", introGeneratedAt: null },
  });
  const total = await prisma.recipe.count({
    where: { published: true, source: "ai" },
  });

  return NextResponse.json({ missing, total });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const { count = 10 } = await request.json();

  const recipes = await prisma.recipe.findMany({
    where: { published: true, source: "ai", introGeneratedAt: null },
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
  const updated: { title: string; slug: string }[] = [];

  for (const recipe of recipes) {
    try {
      const ingredientInputs = recipe.ingredients.map((ri) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      }));

      const description = await generateIntroduction(
        recipe.title,
        ingredientInputs,
        recipe.prepTime,
        recipe.cookTime
      );

      await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          description,
          introGeneratedAt: new Date(),
        },
      });

      updated.push({ title: recipe.title, slug: recipe.slug });
      processed++;
    } catch (err) {
      errors.push(
        `${recipe.title}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return NextResponse.json({ processed, updated, errors });
}
