import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/user-recipes/[id]/share-user
 * Share a user-owned recipe with a specific user by email.
 * Body: { email: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  const isOwner = recipe.createdById === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You already own this recipe" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "User must have an account to be shared with" },
        { status: 404 }
      );
    }

    await prisma.recipeShareUser.upsert({
      where: {
        recipeId_sharedWithUserId: {
          recipeId,
          sharedWithUserId: targetUser.id,
        },
      },
      update: {},
      create: {
        recipeId,
        sharedWithUserId: targetUser.id,
      },
    });

    // Ensure visibility reflects shared state
    if (recipe.visibility === "private") {
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { visibility: "shared" },
      });
    }

    return NextResponse.json({
      sharedWith: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    });
  } catch (error) {
    console.error("Failed to share recipe with user:", error);
    return NextResponse.json(
      { error: "Failed to share recipe" },
      { status: 500 }
    );
  }
}
