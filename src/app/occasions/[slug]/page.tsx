import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getRecipes } from "@/lib/recipes";
import { getOccasionBySlug } from "@/lib/occasions";
import { RecipeCard } from "@/components/recipe/RecipeCard";

interface OccasionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: OccasionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const occasion = await getOccasionBySlug(slug);
  if (!occasion) return { title: "Occasion Not Found" };

  return {
    title: `${occasion.name} Recipes`,
    description:
      occasion.description ||
      `Browse our collection of ${occasion.name} recipes.`,
  };
}

export default async function OccasionPage({
  params,
  searchParams,
}: OccasionPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const occasion = await getOccasionBySlug(slug);
  if (!occasion) notFound();

  const page = parseInt(sp.page || "1", 10);
  const { recipes, total, totalPages } = await getRecipes({
    occasion: slug,
    page,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/recipes"
        className="text-sm text-amber-600 hover:text-amber-700"
      >
        &larr; All Recipes
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-stone-900">
        {occasion.name} Recipes
      </h1>
      {occasion.description && (
        <p className="mt-2 text-stone-500">{occasion.description}</p>
      )}
      <p className="mt-1 text-sm text-stone-400">
        {total} recipe{total !== 1 ? "s" : ""}
      </p>

      {recipes.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-stone-500">
            No {occasion.name} recipes yet.
          </p>
          <Link
            href="/recipes"
            className="mt-4 inline-block text-amber-600 hover:text-amber-700"
          >
            Browse all recipes
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/occasions/${slug}?page=${page - 1}`}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-stone-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/occasions/${slug}?page=${page + 1}`}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
