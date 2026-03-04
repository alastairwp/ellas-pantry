import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ids: [] });
  }

  const saved = await prisma.savedRecipe.findMany({
    where: { userId: session.user.id },
    select: { recipeId: true },
  });

  return NextResponse.json({ ids: saved.map((s) => s.recipeId) });
}
