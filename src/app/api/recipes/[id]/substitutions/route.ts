import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSubstitutions } from "@/lib/generate-substitutions";
import { checkRecipeAccess } from "@/lib/recipe-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_TYPES = ["vegan", "gluten-free", "dairy-free", "budget"];

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const access = await checkRecipeAccess(recipeId);
  if (!access.ok) {
    return NextResponse.json({ error: "Recipe not found" }, { status: access.status });
  }

  const { type } = await request.json();
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
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
    const result = await generateSubstitutions(ingredients, type);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Substitution generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate substitutions" },
      { status: 500 }
    );
  }
}
