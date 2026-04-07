import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.response;

  const runs = await prisma.scrapeRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const totalExternal = await prisma.externalRecipe.count();
  const totalWithPopularity = await prisma.recipePopularity.count({
    where: { compositeScore: { gt: 0 } },
  });

  return NextResponse.json({
    runs,
    totalExternal,
    totalWithPopularity,
  });
}
