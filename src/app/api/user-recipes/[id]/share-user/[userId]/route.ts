import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * DELETE /api/user-recipes/[id]/share-user/[userId]
 * Revoke sharing for a specific user.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id, userId } = await params;
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

  await prisma.recipeShareUser.deleteMany({
    where: { recipeId, sharedWithUserId: userId },
  });

  // If no shares remain and link is off, revert to private
  const remaining = await prisma.recipeShareUser.count({ where: { recipeId } });
  if (remaining === 0 && !recipe.shareToken) {
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { visibility: "private" },
    });
  }

  return NextResponse.json({ success: true });
}
