import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { filterInvalidDietaryTagIds } from "@/lib/dietary-validation";

/**
 * GET /api/user-recipes/[id]
 * Fetch a user-owned recipe. Owner or admin only.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      steps: { orderBy: { stepNumber: "asc" } },
      categories: { include: { category: true } },
      dietaryTags: { include: { dietaryTag: true } },
      sharedWith: {
        include: {
          sharedWith: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  const isOwner = recipe.createdById === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(recipe);
}

/**
 * PUT /api/user-recipes/[id]
 * Update a user-owned recipe. Owner or admin only.
 * Non-admins cannot set visibility=public or published=true.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    const body = await request.json();

    const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!existing) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const isOwner = existing.createdById === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Privilege checks: only admins can set visibility=public or published=true.
    if (!isAdmin) {
      if (body.visibility === "public") {
        return NextResponse.json(
          { error: "Users cannot make recipes public" },
          { status: 403 }
        );
      }
      if (body.published === true) {
        return NextResponse.json(
          { error: "Users cannot publish recipes to the public catalogue" },
          { status: 403 }
        );
      }
    }

    const { ingredients, steps, dietaryTagIds } = body;

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          title: body.title,
          description: body.description,
          prepTime: body.prepTime !== undefined ? parseInt(body.prepTime, 10) : undefined,
          cookTime: body.cookTime !== undefined ? parseInt(body.cookTime, 10) : undefined,
          servings: body.servings !== undefined ? parseInt(body.servings, 10) : undefined,
          difficulty: body.difficulty,
          // visibility only accepted as private/shared for non-admins
          visibility:
            body.visibility === "private" || body.visibility === "shared"
              ? body.visibility
              : isAdmin && body.visibility === "public"
                ? "public"
                : undefined,
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
              quantity: ing.quantity || "",
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

      if (dietaryTagIds) {
        let ingNames: string[];
        if (ingredients) {
          ingNames = ingredients.map((ing: { name: string }) => ing.name);
        } else {
          const currentIngs = await tx.recipeIngredient.findMany({
            where: { recipeId },
            include: { ingredient: true },
          });
          ingNames = currentIngs.map((ri) => ri.ingredient.name);
        }
        const validatedTagIds = await filterInvalidDietaryTagIds(
          ingNames,
          dietaryTagIds as number[]
        );
        await tx.recipeDietaryTag.deleteMany({ where: { recipeId } });
        for (const tagId of validatedTagIds) {
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
        dietaryTags: { include: { dietaryTag: true } },
      },
    });

    return NextResponse.json(full);
  } catch (error) {
    console.error("Failed to update user recipe:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-recipes/[id]
 * Delete a user-owned recipe. Owner or admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!existing) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  const isOwner = existing.createdById === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.recipe.delete({ where: { id: recipeId } });

  // Best-effort cleanup of the locally-stored hero image. We only touch files
  // under /public/images/recipes/ to avoid path traversal, and ignore failures
  // (the DB row is already gone).
  if (existing.heroImage && existing.heroImage.startsWith("/images/recipes/")) {
    try {
      const relative = existing.heroImage.replace(/^\//, "");
      const fullPath = path.join(process.cwd(), "public", relative);
      const imagesRoot = path.join(process.cwd(), "public", "images", "recipes");
      if (fullPath.startsWith(imagesRoot + path.sep)) {
        await unlink(fullPath);
      }
    } catch (err) {
      console.warn(
        `Failed to delete hero image for recipe ${recipeId}:`,
        err
      );
    }
  }

  return NextResponse.json({ success: true });
}
