import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      steps: { orderBy: { stepNumber: "asc" } },
      categories: { include: { category: true } },
      dietaryTags: { include: { dietaryTag: true } },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json(recipe);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    const body = await request.json();

    const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!existing) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const { ingredients, steps, categoryIds, dietaryTagIds } = body;

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          title: body.title,
          description: body.description,
          heroImage: body.heroImage,
          prepTime: body.prepTime !== undefined ? parseInt(body.prepTime, 10) : undefined,
          cookTime: body.cookTime !== undefined ? parseInt(body.cookTime, 10) : undefined,
          servings: body.servings !== undefined ? parseInt(body.servings, 10) : undefined,
          difficulty: body.difficulty,
          published: body.published,
        },
      });

      if (ingredients) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId } });
        for (let i = 0; i < ingredients.length; i++) {
          const ing = ingredients[i];
          if (!ing.name?.trim()) continue;
          const ingredient = await tx.ingredient.upsert({
            where: { name: ing.name.toLowerCase().trim() },
            update: {},
            create: { name: ing.name.toLowerCase().trim() },
          });
          await tx.recipeIngredient.create({
            data: {
              recipeId,
              ingredientId: ingredient.id,
              quantity: ing.quantity,
              unit: ing.unit || null,
              notes: ing.notes || null,
              orderIndex: i,
            },
          });
        }
      }

      if (steps) {
        await tx.recipeStep.deleteMany({ where: { recipeId } });
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (!step.instruction?.trim()) continue;
          await tx.recipeStep.create({
            data: {
              recipeId,
              stepNumber: i + 1,
              instruction: step.instruction,
              tipText: step.tipText || null,
            },
          });
        }
      }

      if (categoryIds) {
        await tx.recipeCategory.deleteMany({ where: { recipeId } });
        for (const catId of categoryIds) {
          await tx.recipeCategory.create({
            data: { recipeId, categoryId: catId },
          });
        }
      }

      if (dietaryTagIds) {
        await tx.recipeDietaryTag.deleteMany({ where: { recipeId } });
        for (const tagId of dietaryTagIds) {
          await tx.recipeDietaryTag.create({
            data: { recipeId, dietaryTagId: tagId },
          });
        }
      }
    });

    const full = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { include: { ingredient: true }, orderBy: { orderIndex: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } },
        categories: { include: { category: true } },
        dietaryTags: { include: { dietaryTag: true } },
      },
    });

    // Revalidate the recipe page so Next.js serves fresh content
    if (full?.slug) {
      revalidatePath(`/recipes/${full.slug}`);
    }

    return NextResponse.json(full);
  } catch (error) {
    console.error("Failed to update recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);

    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
