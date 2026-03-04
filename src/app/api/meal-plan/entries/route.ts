import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { recipeId, day, mealType } = await request.json();

  if (!recipeId || !day || !mealType) {
    return NextResponse.json(
      { error: "recipeId, day, and mealType are required" },
      { status: 400 }
    );
  }

  // Get or create the user's meal plan
  let plan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id },
  });

  if (!plan) {
    plan = await prisma.mealPlan.create({
      data: { userId: session.user.id },
    });
  }

  const entry = await prisma.mealPlanEntry.create({
    data: {
      mealPlanId: plan.id,
      recipeId,
      day,
      mealType,
    },
    include: {
      recipe: {
        select: {
          id: true,
          slug: true,
          title: true,
          heroImage: true,
          prepTime: true,
          cookTime: true,
        },
      },
    },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const entryId = parseInt(
    request.nextUrl.searchParams.get("id") || "",
    10
  );
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 });
  }

  // Verify the entry belongs to the user
  const entry = await prisma.mealPlanEntry.findUnique({
    where: { id: entryId },
    include: { mealPlan: { select: { userId: true } } },
  });

  if (!entry || entry.mealPlan.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mealPlanEntry.delete({ where: { id: entryId } });

  return NextResponse.json({ success: true });
}
