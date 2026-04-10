import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireOwner(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) {
    return { ok: false as const, response: NextResponse.json({ error: "Recipe not found" }, { status: 404 }) };
  }
  const isOwner = recipe.createdById === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, session, recipe };
}

/**
 * POST /api/user-recipes/[id]/share-link
 * Enable or rotate the share-link token.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const check = await requireOwner(recipeId);
  if (!check.ok) return check.response;

  const shareToken = crypto.randomBytes(24).toString("base64url");
  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data: { shareToken, visibility: "shared" },
  });

  return NextResponse.json({ shareToken: updated.shareToken });
}

/**
 * DELETE /api/user-recipes/[id]/share-link
 * Disable the share link. If no named shares remain, revert visibility to "private".
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const check = await requireOwner(recipeId);
  if (!check.ok) return check.response;

  const sharedCount = await prisma.recipeShareUser.count({ where: { recipeId } });
  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      shareToken: null,
      visibility: sharedCount > 0 ? "shared" : "private",
    },
  });

  return NextResponse.json({ success: true });
}
