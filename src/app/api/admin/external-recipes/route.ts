import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const searchParams = request.nextUrl.searchParams;
  const sourceSite = searchParams.get("source") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const sort = searchParams.get("sort") || "popular"; // "popular", "rating", "newest"
  const query = searchParams.get("q") || undefined;

  const where: Record<string, unknown> = {};

  if (sourceSite) {
    where.sourceSite = sourceSite;
  }

  if (query) {
    where.title = { contains: query, mode: "insensitive" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any;
  switch (sort) {
    case "rating":
      orderBy = { ratingValue: "desc" };
      break;
    case "newest":
      orderBy = { scrapedAt: "desc" };
      break;
    case "popular":
    default:
      orderBy = { ratingCount: "desc" };
  }

  const [recipes, total, sourceCounts] = await Promise.all([
    prisma.externalRecipe.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.externalRecipe.count({ where }),
    prisma.externalRecipe.groupBy({
      by: ["sourceSite"],
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    recipes,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    sources: sourceCounts.map((s) => ({
      name: s.sourceSite,
      count: s._count.id,
    })),
  });
}
