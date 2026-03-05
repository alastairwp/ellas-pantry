import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { findRecipeImageFromSource } from "@/lib/unsplash";
import { downloadRecipeImage } from "@/lib/download-image";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const { recipeId, source } = await request.json();

    if (!recipeId || !["unsplash", "pexels"].includes(source)) {
      return NextResponse.json(
        { error: "recipeId and source (unsplash|pexels) are required" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, title: true, slug: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const imageUrl = await findRecipeImageFromSource(recipe.title, source);

    if (!imageUrl) {
      return NextResponse.json(
        { error: `No image found on ${source} for "${recipe.title}"` },
        { status: 404 }
      );
    }

    const localPath = await downloadRecipeImage(imageUrl, recipe.slug, recipe.id);

    return NextResponse.json({
      path: localPath || imageUrl,
      source,
    });
  } catch (error) {
    console.error("Refresh image failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Refresh image failed: ${message}` },
      { status: 500 }
    );
  }
}
