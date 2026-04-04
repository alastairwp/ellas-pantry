import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/generate-recipe";
import { saveGeneratedRecipe } from "@/lib/save-recipe";

/**
 * POST /api/admin/generate
 * Generate a single recipe from a dish name.
 */
export async function POST(request: NextRequest) {
  try {
    const { dishName } = await request.json();

    if (!dishName || typeof dishName !== "string") {
      return NextResponse.json(
        { error: "dishName is required" },
        { status: 400 }
      );
    }

    // Generate recipe with AI
    const recipe = await generateRecipe(dishName);

    // Save to database (image will be generated later via Python script)
    const saved = await saveGeneratedRecipe(recipe, "");

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save recipe to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipe: {
        id: saved.id,
        slug: saved.slug,
        title: recipe.title,
      },
    });
  } catch (error) {
    console.error("Recipe generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Recipe generation failed",
      },
      { status: 500 }
    );
  }
}
