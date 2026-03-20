import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [categories, dietaryTags, occasions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.dietaryTag.findMany({ orderBy: { name: "asc" } }),
    prisma.occasion.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return NextResponse.json({ categories, dietaryTags, occasions });
}
