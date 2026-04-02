import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { webPush, isPushConfigured } from "@/lib/web-push";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications not configured" }, { status: 503 });
  }

  // Fetch the user's meal plan with ingredients
  const plan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id },
    include: {
      meals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: { ingredient: true },
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!plan || plan.meals.length === 0) {
    return NextResponse.json({ error: "No meals planned" }, { status: 400 });
  }

  // Aggregate ingredients
  const ingredientMap = new Map<string, { name: string; quantities: string[] }>();

  for (const entry of plan.meals) {
    for (const ri of entry.recipe.ingredients) {
      const key = ri.ingredient.name.toLowerCase();
      const existing = ingredientMap.get(key);
      const qty = [ri.quantity, ri.unit, ri.notes].filter(Boolean).join(" ").trim();

      if (existing) {
        if (qty && !existing.quantities.includes(qty)) {
          existing.quantities.push(qty);
        }
      } else {
        ingredientMap.set(key, {
          name: ri.ingredient.name,
          quantities: qty ? [qty] : [],
        });
      }
    }
  }

  const items = [...ingredientMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const recipeCount = plan.meals.length;
  const itemCount = items.length;

  // Build notification body — show a few items as preview
  const preview = items
    .slice(0, 5)
    .map((i) => i.name)
    .join(", ");
  const moreText = itemCount > 5 ? ` and ${itemCount - 5} more...` : "";

  const payload = JSON.stringify({
    title: "Your Weekly Shopping List",
    body: `${recipeCount} meals planned, ${itemCount} items needed: ${preview}${moreText}`,
    url: "/meal-planner?tab=shopping",
    tag: "shopping-list",
    actions: [
      { action: "view-list", title: "View Full List" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });

  // Send to all user's subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (error: unknown) {
        // Remove expired/invalid subscriptions
        if (error && typeof error === "object" && "statusCode" in error) {
          const statusCode = (error as { statusCode: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
        throw error;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, totalItems: itemCount });
}
