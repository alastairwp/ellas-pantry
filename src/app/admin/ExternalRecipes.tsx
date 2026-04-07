"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ExternalRecipe {
  id: number;
  sourceSite: string;
  sourceUrl: string;
  title: string;
  ratingValue: number | null;
  ratingCount: number | null;
  reviewCount: number | null;
  categories: string[];
  seasonalTags: string[];
  scrapedAt: string;
}

interface Source {
  name: string;
  count: number;
}

const SOURCE_LABELS: Record<string, string> = {
  bbcgoodfood: "BBC Good Food",
  delicious: "Delicious Magazine",
  simplyrecipes: "Simply Recipes",
  foodcom: "Food.com",
  loveandlemons: "Love and Lemons",
};

export function ExternalRecipes() {
  const [recipes, setRecipes] = useState<ExternalRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [sort, setSort] = useState("popular");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    params.set("sort", sort);
    if (sourceFilter) params.set("source", sourceFilter);
    if (query) params.set("q", query);

    try {
      const res = await fetch(`/api/admin/external-recipes?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setRecipes(data.recipes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setSources(data.sources);
    } finally {
      setLoading(false);
    }
  }, [page, sort, sourceFilter, query]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-stone-900">{total.toLocaleString()}</p>
          <p className="text-sm text-stone-500">
            {sourceFilter ? SOURCE_LABELS[sourceFilter] || sourceFilter : "All Sources"}
          </p>
        </div>
        {sources.map((s) => (
          <button
            key={s.name}
            onClick={() => {
              setSourceFilter(sourceFilter === s.name ? "" : s.name);
              setPage(1);
            }}
            className={`rounded-xl border p-4 text-left transition-colors ${
              sourceFilter === s.name
                ? "border-amber-400 bg-amber-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <p className="text-xl font-bold text-stone-900">{s.count.toLocaleString()}</p>
            <p className="text-xs text-stone-500 truncate">
              {SOURCE_LABELS[s.name] || s.name}
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search external recipes..."
              className="w-full rounded-lg border border-stone-300 py-2 pl-10 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Search
          </button>
        </form>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Recently Scraped</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <Globe className="h-10 w-10 mx-auto mb-3 text-stone-300" />
          <p>No external recipes found.</p>
          <p className="text-sm mt-1">Run the scraper to populate this data.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Source</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Rating</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">Reviews</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Categories</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900 max-w-[300px] truncate">
                    {r.title}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {SOURCE_LABELS[r.sourceSite] || r.sourceSite}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.ratingValue != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        {r.ratingValue.toFixed(1)}
                        {r.ratingCount != null && (
                          <span className="text-stone-400 text-xs">
                            ({r.ratingCount.toLocaleString()})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-500">
                    {r.reviewCount?.toLocaleString() ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                        >
                          {cat}
                        </span>
                      ))}
                      {r.categories.length > 3 && (
                        <span className="text-xs text-stone-400">
                          +{r.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-amber-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Page {page} of {totalPages} ({total.toLocaleString()} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
