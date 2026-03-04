import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ saved: false });
  }

  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const existing = await prisma.savedRecipe.findUnique({
    where: { userId_recipeId: { userId: session.user.id, recipeId } },
  });

  return NextResponse.json({ saved: !!existing });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to save recipes" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const existing = await prisma.savedRecipe.findUnique({
    where: { userId_recipeId: { userId: session.user.id, recipeId } },
  });

  if (existing) {
    await prisma.savedRecipe.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ saved: false });
  }

  await prisma.savedRecipe.create({
    data: { userId: session.user.id, recipeId },
  });

  return NextResponse.json({ saved: true });
}
