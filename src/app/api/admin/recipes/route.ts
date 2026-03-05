import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get("source") || undefined;
  const published = searchParams.get("published");
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
  if (published === "true") {
    where.published = true;
  } else if (published === "false") {
    where.published = false;
  }

  const [recipes, total, countBySource, pendingCount] = await Promise.all([
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
    prisma.recipe.count({ where: { published: false } }),
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
    pendingCount,
  });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const { ids, published } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0 || typeof published !== "boolean") {
      return NextResponse.json(
        { error: "ids (array) and published (boolean) are required" },
        { status: 400 }
      );
    }

    const result = await prisma.recipe.updateMany({
      where: { id: { in: ids } },
      data: { published },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("Bulk update failed:", error);
    return NextResponse.json(
      { error: "Bulk update failed" },
      { status: 500 }
    );
  }
}
