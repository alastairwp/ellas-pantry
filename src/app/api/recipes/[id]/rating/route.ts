import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const stats = await prisma.rating.aggregate({
    where: { recipeId },
    _avg: { score: true },
    _count: { score: true },
  });

  const result: { average: number; count: number; userRating: number | null } = {
    average: Math.round((stats._avg.score || 0) * 10) / 10,
    count: stats._count.score,
    userRating: null,
  };

  // If user is logged in, include their rating
  const session = await auth();
  if (session?.user?.id) {
    const userRating = await prisma.rating.findUnique({
      where: { userId_recipeId: { userId: session.user.id, recipeId } },
    });
    result.userRating = userRating?.score ?? null;
  }

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to rate recipes" }, { status: 401 });
  }

  const { id } = await params;
  const recipeId = parseInt(id, 10);
  const { score } = await request.json();

  if (!score || score < 1 || score > 5 || !Number.isInteger(score)) {
    return NextResponse.json({ error: "Score must be an integer from 1 to 5" }, { status: 400 });
  }

  // Upsert: create or update the user's rating
  await prisma.rating.upsert({
    where: { userId_recipeId: { userId: session.user.id, recipeId } },
    create: { userId: session.user.id, recipeId, score },
    update: { score },
  });

  // Return updated stats
  const stats = await prisma.rating.aggregate({
    where: { recipeId },
    _avg: { score: true },
    _count: { score: true },
  });

  return NextResponse.json({
    average: Math.round((stats._avg.score || 0) * 10) / 10,
    count: stats._count.score,
    userRating: score,
  });
}
