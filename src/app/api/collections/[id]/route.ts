import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      recipes: {
        include: {
          recipe: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              heroImage: true,
              prepTime: true,
              cookTime: true,
              difficulty: true,
              servings: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json({ collection });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  await prisma.collection.delete({ where: { id: collection.id } });

  return NextResponse.json({ success: true });
}
