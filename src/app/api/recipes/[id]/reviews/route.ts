import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const limit = 10;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.review.count({ where: { recipeId } }),
  ]);

  return NextResponse.json({ reviews, total });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Review text is required" },
      { status: 400 }
    );
  }

  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Review must be under 2000 characters" },
      { status: 400 }
    );
  }

  const review = await prisma.review.upsert({
    where: {
      userId_recipeId: {
        userId: session.user.id,
        recipeId,
      },
    },
    update: { text: text.trim() },
    create: {
      text: text.trim(),
      userId: session.user.id,
      recipeId,
    },
    include: {
      user: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json({ review });
}
