import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { recipes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const trimmed = name.trim();
  let slug = slugify(trimmed);

  // Check for duplicate slug for this user
  const existing = await prisma.collection.findUnique({
    where: { userId_slug: { userId: session.user.id, slug } },
  });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const collection = await prisma.collection.create({
    data: {
      name: trimmed,
      slug,
      userId: session.user.id,
    },
    include: {
      _count: { select: { recipes: true } },
    },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
