import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const ingredients = await prisma.ingredient.findMany({
    where: { name: { contains: q } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(ingredients);
}
