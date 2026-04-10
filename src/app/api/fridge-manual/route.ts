import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { matchIngredientNames, matchRecipesByIngredientIds } from "@/lib/fridge-match";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { ingredientNames } = await request.json();
    if (!Array.isArray(ingredientNames) || ingredientNames.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required" },
        { status: 400 }
      );
    }

    const matched = await matchIngredientNames(ingredientNames);
    const matchedIds = matched.map((i) => i.id);
    const recipes = await matchRecipesByIngredientIds(matchedIds, session.user.id);
    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Manual fridge match error:", error);
    return NextResponse.json(
      { error: "Failed to find matching recipes" },
      { status: 500 }
    );
  }
}
