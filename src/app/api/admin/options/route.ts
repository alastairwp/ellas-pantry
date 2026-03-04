import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [categories, dietaryTags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.dietaryTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ categories, dietaryTags });
}
