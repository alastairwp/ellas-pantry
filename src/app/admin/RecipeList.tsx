"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, ExternalLink, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface RecipeItem {
  id: number;
  slug: string;
  title: string;
  source: string;
  published: boolean;
  createdAt: string;
  categories: { category: { name: string } }[];
  dietaryTags: { dietaryTag: { name: string } }[];
}

interface Counts {
  ai?: number;
  csv?: number;
  manual?: number;
}

export function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      if (sourceFilter) params.set("source", sourceFilter);

      const res = await fetch(`/api/admin/recipes?${params.toString()}`);
      const data = await res.json();

      setRecipes(data.recipes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCounts(data.counts);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoading(false);
    }
  }, [page, sourceFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  function handleSourceChange(source: string) {
    setSourceFilter(source);
    setPage(1);
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "title" ? "asc" : "desc");
    }
    setPage(1);
  }

  function sortIcon(field: string) {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-stone-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-amber-600" />
      : <ArrowDown className="h-3.5 w-3.5 text-amber-600" />;
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRecipes();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const totalAll =
    (counts.ai || 0) + (counts.csv || 0) + (counts.manual || 0);

  const filterBtn = (label: string, value: string, count?: number) => (
    <button
      onClick={() => handleSourceChange(value)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        sourceFilter === value
          ? "bg-amber-600 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 text-xs opacity-75">({count})</span>
      )}
    </button>
  );

  const sourceLabel = (source: string) => {
    switch (source) {
      case "ai":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            AI
          </span>
        );
      case "csv":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            CSV
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            Manual
          </span>
        );
    }
  };

  return (
    <div>
      {/* Source filter pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {filterBtn("All", "", totalAll)}
        {filterBtn("AI Generated", "ai", counts.ai)}
        {filterBtn("CSV Import", "csv", counts.csv)}
        {filterBtn("Manual", "manual", counts.manual)}
      </div>

      {/* Stats bar */}
      <div className="mb-4 text-sm text-stone-500">
        Showing {recipes.length} of {total} recipes
        {sourceFilter && (
          <span>
            {" "}
            (filtered by{" "}
            <strong>{sourceFilter === "ai" ? "AI Generated" : sourceFilter === "csv" ? "CSV Import" : "Manual"}</strong>)
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-stone-400">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="py-12 text-center text-stone-400">
          No recipes found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-600">
                  <button onClick={() => handleSort("title")} className="inline-flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                    Recipe {sortIcon("title")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-600 w-20">
                  <button onClick={() => handleSort("source")} className="inline-flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                    Source {sortIcon("source")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-600 hidden sm:table-cell">
                  Categories
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-600 hidden md:table-cell w-28">
                  <button onClick={() => handleSort("createdAt")} className="inline-flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                    Created {sortIcon("createdAt")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-stone-600 w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <a
                      href={`/recipes/${recipe.slug}`}
                      target="_blank"
                      className="font-medium text-stone-800 hover:text-amber-600 transition-colors"
                    >
                      {recipe.title}
                    </a>
                  </td>
                  <td className="px-4 py-3">{sourceLabel(recipe.source)}</td>
                  <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">
                    {recipe.categories
                      .map((c) => c.category.name)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/recipes/${recipe.slug}`}
                        target="_blank"
                        className="text-stone-400 hover:text-amber-600 transition-colors"
                        title="View recipe"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                        title="Delete recipe"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
