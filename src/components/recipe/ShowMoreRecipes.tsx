"use client";

import { useState } from "react";
import { RecipeCard } from "./RecipeCard";
import type { RecipeCardData } from "@/types/recipe";

interface ShowMoreRecipesProps {
  initialRecipes: RecipeCardData[];
  totalPages: number;
  filterParam: string;
  limit: number;
}

export function ShowMoreRecipes({
  initialRecipes,
  totalPages,
  filterParam,
  limit,
}: ShowMoreRecipesProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/recipes?${filterParam}&page=${nextPage}&limit=${limit}`
      );
      const data = await res.json();
      setRecipes((prev) => [...prev, ...data.recipes]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.slug} recipe={recipe} />
        ))}
      </div>

      {page < totalPages && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Show More"}
          </button>
        </div>
      )}
    </>
  );
}
