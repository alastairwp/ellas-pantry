import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

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
    return NextResponse.json({ items: [] });
  }

  // Aggregate ingredients across all planned recipes
  const ingredientMap = new Map<
    string,
    { name: string; quantities: string[] }
  >();

  for (const entry of plan.meals) {
    for (const ri of entry.recipe.ingredients) {
      const name = ri.ingredient.name.toLowerCase();
      const existing = ingredientMap.get(name);
      const qty = [ri.quantity, ri.unit, ri.notes]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (existing) {
        if (qty && !existing.quantities.includes(qty)) {
          existing.quantities.push(qty);
        }
      } else {
        ingredientMap.set(name, {
          name: ri.ingredient.name,
          quantities: qty ? [qty] : [],
        });
      }
    }
  }

  const items = [...ingredientMap.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      name: item.name,
      detail: item.quantities.join(" + "),
    }));

  return NextResponse.json({ items });
}
