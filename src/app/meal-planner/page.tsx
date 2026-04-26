import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { MealPlanner } from "./MealPlanner";

export const metadata: Metadata = {
  title: "Meal Planner",
  description:
    "Plan your weekly meals and generate a shopping list from your favourite recipes.",
};

export default async function MealPlannerPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">Meal Planner</h1>
      <p className="mt-2 text-neutral-500">
        Plan your meals for the week and get an auto-generated shopping list.
      </p>

      <div className="mt-8">
        <MealPlanner />
      </div>
    </div>
  );
}
