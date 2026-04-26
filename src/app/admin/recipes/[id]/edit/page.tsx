import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecipeEditForm } from "./RecipeEditForm";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditPageProps) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      steps: { orderBy: { stepNumber: "asc" } },
      categories: { include: { category: true } },
      dietaryTags: { include: { dietaryTag: true } },
      occasions: { include: { occasion: true } },
    },
  });

  if (!recipe) notFound();

  const initialData = {
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    heroImage: recipe.heroImage,
    imageStatus: recipe.imageStatus,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    published: recipe.published,
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
    categoryIds: recipe.categories.map((c) => c.category.id),
    dietaryTagIds: recipe.dietaryTags.map((dt) => dt.dietaryTag.id),
    occasionIds: recipe.occasions.map((o) => o.occasion.id),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">Edit Recipe</h1>
      <RecipeEditForm initialData={initialData} />
    </div>
  );
}
