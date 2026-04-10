import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth-guard";
import { filterInvalidDietaryTagIds } from "@/lib/dietary-validation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const query = searchParams.get("query");

  const where: Record<string, unknown> = { published: true, visibility: "public" };
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
    ];
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        categories: { include: { category: true } },
        dietaryTags: { include: { dietaryTag: true } },
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  return NextResponse.json({ recipes, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const body = await request.json();
    const {
      title,
      description,
      heroImage,
      prepTime,
      cookTime,
      servings,
      difficulty = "Medium",
      ingredients,
      steps,
      categoryIds = [],
      dietaryTagIds = [],
    } = body;

    if (!title || !description || !heroImage) {
      return NextResponse.json(
        { error: "Title, description, and heroImage are required" },
        { status: 400 }
      );
    }

    // Filter dietary tags that contradict ingredients
    const ingredientNames = (ingredients || []).map(
      (ing: { name: string }) => ing.name
    );
    const validatedDietaryTagIds = await filterInvalidDietaryTagIds(
      ingredientNames,
      dietaryTagIds as number[]
    );

    let slug = slugify(title);

    // Ensure unique slug
    const existing = await prisma.recipe.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const recipe = await prisma.recipe.create({
      data: {
        slug,
        title,
        description,
        heroImage,
        prepTime: parseInt(prepTime, 10) || 0,
        cookTime: parseInt(cookTime, 10) || 0,
        servings: parseInt(servings, 10) || 4,
        difficulty,
        ingredients: {
          create: await Promise.all(
            (ingredients || []).map(
              async (
                ing: { name: string; quantity: string; unit?: string; notes?: string },
                index: number
              ) => {
                const ingredient = await prisma.ingredient.upsert({
                  where: { name: ing.name.toLowerCase().trim() },
                  update: {},
                  create: { name: ing.name.toLowerCase().trim() },
                });
                return {
                  ingredientId: ingredient.id,
                  quantity: ing.quantity,
                  unit: ing.unit || null,
                  notes: ing.notes || null,
                  orderIndex: index,
                };
              }
            )
          ),
        },
        steps: {
          create: (steps || []).map(
            (step: { instruction: string; tipText?: string }, index: number) => ({
              stepNumber: index + 1,
              instruction: step.instruction,
              tipText: step.tipText || null,
            })
          ),
        },
        categories: {
          create: (categoryIds as number[]).map((id: number) => ({
            categoryId: id,
          })),
        },
        dietaryTags: {
          create: (validatedDietaryTagIds).map((id: number) => ({
            dietaryTagId: id,
          })),
        },
      },
      include: {
        ingredients: { include: { ingredient: true } },
        steps: true,
        categories: { include: { category: true } },
        dietaryTags: { include: { dietaryTag: true } },
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Failed to create recipe:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}
