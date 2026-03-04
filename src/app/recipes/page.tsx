import type { Metadata } from "next";
import Link from "next/link";
import { getRecipes } from "@/lib/recipes";
import { getCategories } from "@/lib/categories";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { DietaryFilter } from "@/components/filters/DietaryFilter";
import { CategoryFilter } from "@/components/filters/CategoryFilter";
import { DifficultyFilter } from "@/components/filters/DifficultyFilter";
import { CookTimeFilter } from "@/components/filters/CookTimeFilter";
import { SortFilter } from "@/components/filters/SortFilter";
import { IngredientSearch } from "@/components/filters/IngredientSearch";

export const metadata: Metadata = {
  title: "Browse Recipes",
  description:
    "Browse our full collection of recipes. Filter by dietary requirements and categories.",
};

interface RecipesPageProps {
  searchParams: Promise<{
    q?: string;
    dietary?: string;
    category?: string;
    difficulty?: string;
    maxCookTime?: string;
    ingredient?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const sp = await searchParams;
  const query = sp.q || undefined;
  const dietary = sp.dietary?.split(",").filter(Boolean) || undefined;
  const category = sp.category || undefined;
  const difficulty = sp.difficulty || undefined;
  const maxCookTime = sp.maxCookTime ? parseInt(sp.maxCookTime, 10) : undefined;
  const ingredient = sp.ingredient || undefined;
  const sort = sp.sort || undefined;
  const page = parseInt(sp.page || "1", 10);

  const [{ recipes, total, totalPages }, categories] = await Promise.all([
    getRecipes({ query, dietary, category, difficulty, maxCookTime, ingredient, sort, page }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900">
        {query ? `Results for "${query}"` : "All Recipes"}
      </h1>
      <p className="mt-2 text-stone-500">
        {total} recipe{total !== 1 ? "s" : ""} found
      </p>

      {/* Filters */}
      <div className="mt-6 space-y-3">
        <DietaryFilter />
        <CategoryFilter categories={categories} />
        <div className="flex flex-wrap items-center gap-3">
          <DifficultyFilter />
          <CookTimeFilter />
          <IngredientSearch />
          <SortFilter />
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.slug} recipe={recipe} />
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg text-stone-500">
            No recipes found matching your filters.
          </p>
          <Link
            href="/recipes"
            className="mt-4 inline-block text-amber-600 hover:text-amber-700"
          >
            Clear filters
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <PaginationLink page={page - 1} searchParams={sp}>
              Previous
            </PaginationLink>
          )}
          <span className="px-3 py-2 text-sm text-stone-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink page={page + 1} searchParams={sp}>
              Next
            </PaginationLink>
          )}
        </nav>
      )}
    </div>
  );
}

function PaginationLink({
  page,
  searchParams,
  children,
}: {
  page: number;
  searchParams: Record<string, string | undefined>;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.dietary) params.set("dietary", searchParams.dietary);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.difficulty) params.set("difficulty", searchParams.difficulty);
  if (searchParams.maxCookTime) params.set("maxCookTime", searchParams.maxCookTime);
  if (searchParams.ingredient) params.set("ingredient", searchParams.ingredient);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  params.set("page", String(page));

  return (
    <Link
      href={`/recipes?${params.toString()}`}
      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
    >
      {children}
    </Link>
  );
}
