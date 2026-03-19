import type { Metadata } from "next";
import Link from "next/link";
import { getRecipes } from "@/lib/recipes";
import { getCategories } from "@/lib/categories";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { FilterSidebar } from "@/components/filters/FilterSidebar";

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
    forMe?: string;
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
  const forMe = sp.forMe === "true";

  // If "Recipes for me" is active, fetch user allergies
  let excludeAllergens: string[] | undefined;
  if (forMe) {
    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { allergies: true },
      });
      if (user?.allergies?.length) {
        excludeAllergens = user.allergies;
      }
    }
  }

  const [{ recipes, total, totalPages }, categories] = await Promise.all([
    getRecipes({ query, dietary, category, difficulty, maxCookTime, ingredient, sort, page, excludeAllergens }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">
          {query ? `Results for "${query}"` : "All Recipes"}
        </h1>
        <p className="mt-2 text-stone-500">
          {total} recipe{total !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Mobile filter button */}
      <div className="mb-4 lg:hidden">
        <FilterSidebar categories={categories} />
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar categories={categories} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Recipe Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
      </div>
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
  if (searchParams.forMe) params.set("forMe", searchParams.forMe);
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
