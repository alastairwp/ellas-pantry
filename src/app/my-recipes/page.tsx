import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { DeleteUserRecipeButton } from "@/components/recipe/DeleteUserRecipeButton";
import type { RecipeCardData } from "@/types/recipe";

export const metadata: Metadata = {
  title: "My recipes",
};

const recipeCardSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  heroImage: true,
  prepTime: true,
  cookTime: true,
  dietaryTags: {
    include: { dietaryTag: { select: { name: true, slug: true } } },
  },
  categories: {
    include: { category: { select: { name: true, slug: true } } },
  },
} as const;

export default async function MyRecipesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [owned, sharedJoins] = await Promise.all([
    prisma.recipe.findMany({
      where: { createdById: session.user.id, published: false },
      select: recipeCardSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipeShareUser.findMany({
      where: { sharedWithUserId: session.user.id },
      include: { recipe: { select: recipeCardSelect } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const shared = sharedJoins
    .map((sj) => sj.recipe)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">My recipes</h1>
          <p className="mt-2 text-stone-500">
            Recipes you&apos;ve created or had shared with you. None of these
            appear in the public catalogue.
          </p>
        </div>
        <Link
          href="/recipes/new/from-photo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
        >
          <Camera className="h-4 w-4" />
          Create from photo
        </Link>
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-stone-800 mb-4">
          My recipes ({owned.length})
        </h2>
        {owned.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-stone-500 mb-4">
              You haven&apos;t created any recipes yet.
            </p>
            <Link
              href="/recipes/new/from-photo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
            >
              <Camera className="h-4 w-4" />
              Create your first one
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {owned.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard recipe={recipe as RecipeCardData} />
                <Link
                  href={`/my-recipes/${recipe.id}/edit`}
                  className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur text-stone-700 text-xs font-medium rounded-full shadow-sm hover:bg-white"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Link>
                <DeleteUserRecipeButton
                  recipeId={recipe.id}
                  recipeTitle={recipe.title}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {shared.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-stone-800 mb-4">
            Shared with me ({shared.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shared.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe as RecipeCardData} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
