import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const { recipeId } = await request.json();
  if (!recipeId || typeof recipeId !== "number") {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }

  // Upsert to avoid duplicate errors
  await prisma.collectionRecipe.upsert({
    where: {
      collectionId_recipeId: { collectionId, recipeId },
    },
    update: {},
    create: { collectionId, recipeId },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });
  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const { recipeId } = await request.json();

  await prisma.collectionRecipe.deleteMany({
    where: { collectionId, recipeId },
  });

  return NextResponse.json({ success: true });
}
