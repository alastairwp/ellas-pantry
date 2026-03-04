import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get("source") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const allowedSortFields = ["title", "createdAt", "source"];
  const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const where: Record<string, unknown> = {};
  if (source) {
    where.source = source;
  }

  const [recipes, total, countBySource] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { [orderField]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        heroImage: true,
        source: true,
        published: true,
        createdAt: true,
        categories: { include: { category: { select: { name: true } } } },
        dietaryTags: { include: { dietaryTag: { select: { name: true } } } },
      },
    }),
    prisma.recipe.count({ where }),
    prisma.recipe.groupBy({
      by: ["source"],
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(
    countBySource.map((g) => [g.source, g._count._all])
  );

  return NextResponse.json({
    recipes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    counts,
  });
}
