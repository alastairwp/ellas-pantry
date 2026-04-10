import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTroubleshooting } from "@/lib/generate-troubleshooting";
import { checkRecipeAccess } from "@/lib/recipe-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const access = await checkRecipeAccess(recipeId);
  if (!access.ok) {
    return NextResponse.json({ error: "Recipe not found" }, { status: access.status });
  }

  const { problemDescription } = await request.json();
  if (
    typeof problemDescription !== "string" ||
    problemDescription.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "problemDescription must be a non-empty string" },
      { status: 400 }
    );
  }

  if (problemDescription.length > 500) {
    return NextResponse.json(
      { error: "problemDescription must be 500 characters or less" },
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
      steps: {
        orderBy: { stepNumber: "asc" },
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

  const steps = recipe.steps.map((s) => ({
    stepNumber: s.stepNumber,
    instruction: s.instruction,
  }));

  try {
    const result = await generateTroubleshooting(
      recipe.title,
      ingredients,
      steps,
      recipe.difficulty,
      problemDescription.trim()
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Troubleshooting generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate troubleshooting advice" },
      { status: 500 }
    );
  }
}
