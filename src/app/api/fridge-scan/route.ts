import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { image } = await request.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Extract media type and base64 data from data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid image format. Expected base64 data URL." },
        { status: 400 }
      );
    }
    const mediaType = match[1] as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    const data = match[2];

    // Call Claude Vision to identify ingredients
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            {
              type: "text",
              text: 'Look at this photo of a fridge, freezer, or food items. List all food ingredients you can identify. Return ONLY a JSON array of simple ingredient names as lowercase strings. Use common/generic names. Example: ["chicken breast", "butter", "onion", "milk", "cheddar cheese", "eggs", "tomato"]',
            },
          ],
        },
      ],
    });

    // Parse ingredient list from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not identify ingredients from the image" },
        { status: 422 }
      );
    }

    const identifiedIngredients: string[] = JSON.parse(jsonMatch[0]);

    // Match against Ingredient table
    const matchedIngredients = await prisma.ingredient.findMany({
      where: {
        OR: identifiedIngredients.map((name) => ({
          name: { contains: name.toLowerCase() },
        })),
      },
      select: { id: true, name: true },
    });

    const matchedIds = matchedIngredients.map((i) => i.id);

    if (matchedIds.length === 0) {
      return NextResponse.json({
        ingredients: identifiedIngredients,
        recipes: [],
      });
    }

    // Find recipes using matched ingredients
    const recipes = await prisma.recipe.findMany({
      where: {
        published: true,
        ingredients: {
          some: { ingredientId: { in: matchedIds } },
        },
      },
      select: {
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
        ingredients: {
          select: { ingredientId: true },
        },
      },
    });

    // Score by missing ingredients (fewer missing = better match)
    const matchedIdSet = new Set(matchedIds);
    const scored = recipes
      .map((recipe) => {
        const totalIngredients = recipe.ingredients.length;
        const matchCount = recipe.ingredients.filter((i) =>
          matchedIdSet.has(i.ingredientId)
        ).length;
        const missingCount = totalIngredients - matchCount;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ingredients: _, ...recipeCard } = recipe;
        return {
          ...recipeCard,
          matchCount,
          totalIngredients,
          missingCount,
        };
      })
      .sort((a, b) => {
        // Sort by fewest missing ingredients first
        if (a.missingCount !== b.missingCount)
          return a.missingCount - b.missingCount;
        // Tie-break: prefer recipes with fewer total ingredients (simpler)
        return a.totalIngredients - b.totalIngredients;
      })
      .slice(0, 30);

    return NextResponse.json({
      ingredients: identifiedIngredients,
      recipes: scored,
    });
  } catch (error) {
    console.error("Fridge scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan image" },
      { status: 500 }
    );
  }
}
