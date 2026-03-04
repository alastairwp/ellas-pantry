import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSavedRecipes } from "@/lib/saved-recipes";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "My Favourites",
  description: "Your saved recipes collection.",
};

interface SavedRecipesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SavedRecipesPage({
  searchParams,
}: SavedRecipesPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const sp = await searchParams;
  const page = parseInt(sp.page || "1", 10);
  const { recipes, total, totalPages } = await getSavedRecipes(
    session.user.id,
    page
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3">
        <Heart className="h-7 w-7 text-red-500 fill-red-500" />
        <h1 className="text-3xl font-bold text-stone-900">My Favourites</h1>
      </div>
      <p className="mt-2 text-stone-500">
        {total} saved recipe{total !== 1 ? "s" : ""}
      </p>

      {recipes.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-stone-300" />
          <p className="mt-4 text-lg text-stone-500">
            No saved recipes yet.
          </p>
          <Link
            href="/recipes"
            className="mt-4 inline-block text-amber-600 hover:text-amber-700 font-medium"
          >
            Browse recipes to find something you love
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/saved-recipes?page=${page - 1}`}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-stone-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/saved-recipes?page=${page + 1}`}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
