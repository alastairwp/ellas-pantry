import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const entryInclude = {
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
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Get or create the user's meal plan
  let plan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id },
    include: { meals: { include: entryInclude } },
  });

  if (!plan) {
    plan = await prisma.mealPlan.create({
      data: { userId: session.user.id },
      include: { meals: { include: entryInclude } },
    });
  }

  return NextResponse.json({ plan });
}

export async function PUT() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const plan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "No meal plan found" }, { status: 404 });
  }

  // Clear all entries
  await prisma.mealPlanEntry.deleteMany({
    where: { mealPlanId: plan.id },
  });

  const updated = await prisma.mealPlan.findFirst({
    where: { id: plan.id },
    include: { meals: { include: entryInclude } },
  });

  return NextResponse.json({ plan: updated });
}
