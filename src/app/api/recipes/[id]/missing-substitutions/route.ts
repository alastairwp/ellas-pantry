import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMissingSubstitutions } from "@/lib/generate-missing-substitutions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const { missingIngredients } = await request.json();
  if (
    !Array.isArray(missingIngredients) ||
    missingIngredients.length === 0 ||
    !missingIngredients.every((i: unknown) => typeof i === "string")
  ) {
    return NextResponse.json(
      { error: "missingIngredients must be a non-empty array of strings" },
      { status: 400 }
    );
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const ingredients = recipe.ingredients.map((ri) => ({
    name: ri.ingredient.name,
    quantity: ri.quantity,
    unit: ri.unit,
  }));

  try {
    const result = await generateMissingSubstitutions(
      recipe.title,
      ingredients,
      missingIngredients
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Missing substitution generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate substitutions" },
      { status: 500 }
    );
  }
}
