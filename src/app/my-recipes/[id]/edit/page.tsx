import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRecipeEditForm } from "./UserRecipeEditForm";

export const metadata: Metadata = {
  title: "Edit recipe",
};

export default async function EditUserRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) notFound();

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      steps: { orderBy: { stepNumber: "asc" } },
      sharedWith: {
        include: {
          sharedWith: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!recipe) notFound();

  const isOwner = recipe.createdById === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) notFound();

  const initialData = {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    visibility: (recipe.visibility as "public" | "private" | "shared") || "private",
    shareToken: recipe.shareToken,
    ingredients: recipe.ingredients.map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit || "",
      notes: ri.notes || "",
    })),
    steps: recipe.steps.map((s) => ({
      instruction: s.instruction,
      tipText: s.tipText || "",
    })),
    sharedUsers: recipe.sharedWith.map((sw) => ({
      id: sw.sharedWith.id,
      email: sw.sharedWith.email,
      name: sw.sharedWith.name,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">Edit recipe</h1>
      <p className="mt-2 text-neutral-500">
        Refine your recipe and choose how to share it. Your recipes are private
        by default.
      </p>
      <div className="mt-8">
        <UserRecipeEditForm initialData={initialData} />
      </div>
    </div>
  );
}
