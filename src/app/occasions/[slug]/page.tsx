import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getRecipes } from "@/lib/recipes";
import { getOccasionBySlug } from "@/lib/occasions";
import { ShowMoreRecipes } from "@/components/recipe/ShowMoreRecipes";

interface OccasionPageProps {
  params: Promise<{ slug: string }>;
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
}: OccasionPageProps) {
  const { slug } = await params;
  const occasion = await getOccasionBySlug(slug);
  if (!occasion) notFound();

  const { recipes, total, totalPages } = await getRecipes({
    occasion: slug,
    limit: 36,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/recipes"
        className="text-sm text-amber-600 hover:text-amber-700"
      >
        &larr; All Recipes
      </Link>
      <h1 id="recipes" className="mt-4 text-3xl font-bold text-stone-900 scroll-mt-4">
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
        <div className="mt-8">
          <ShowMoreRecipes
            initialRecipes={recipes}
            totalPages={totalPages}
            filterParam={`occasion=${slug}`}
            limit={36}
          />
        </div>
      )}
    </div>
  );
}
