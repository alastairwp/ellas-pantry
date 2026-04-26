"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  Pencil,
  Eye,
  EyeOff,
  LayoutGrid,
  LayoutList,
  ImageIcon,
  Search,
  X,
} from "lucide-react";

interface RecipeItem {
  id: number;
  slug: string;
  title: string;
  heroImage: string;
  source: string;
  imageStatus: string;
  published: boolean;
  createdAt: string;
  categories: { category: { name: string } }[];
  dietaryTags: { dietaryTag: { name: string } }[];
}

interface Counts {
  ai?: number;
  csv?: number;
  manual?: number;
  external?: number;
}

export function RecipeList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "", 10);
    return p > 0 ? p : 1;
  });
  const [sourceFilter, setSourceFilter] = useState<string>(searchParams.get("source") || "");
  const [publishedFilter, setPublishedFilter] = useState<string>(searchParams.get("published") || "");
  const [imageFilter, setImageFilter] = useState<string>(searchParams.get("image") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">((searchParams.get("sortDir") as "asc" | "desc") || "desc");
  const [counts, setCounts] = useState<Counts>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = parseInt(localStorage.getItem("admin-page-size") || "", 10);
      if ([25, 50, 100, 200].includes(saved)) return saved;
    }
    return 25;
  });
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep a ref to searchParams so the URL sync effect doesn't depend on it
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  // Sync filter/sort/page state to URL search params
  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString());

    const setOrDelete = (key: string, value: string, defaultValue = "") => {
      if (value && value !== defaultValue) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    setOrDelete("search", debouncedSearch);
    setOrDelete("source", sourceFilter);
    setOrDelete("published", publishedFilter);
    setOrDelete("image", imageFilter);
    setOrDelete("sortBy", sortBy, "createdAt");
    setOrDelete("sortDir", sortDir, "desc");
    setOrDelete("page", String(page), "1");

    const qs = params.toString();
    router.replace(`/admin${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, sourceFilter, publishedFilter, imageFilter, sortBy, sortDir, page, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      if (sourceFilter) params.set("source", sourceFilter);
      if (publishedFilter) params.set("published", publishedFilter);
      if (imageFilter) params.set("imageStatus", imageFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/recipes?${params.toString()}`);
      const data = await res.json();

      setRecipes(data.recipes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCounts(data.counts);
      setPendingCount(data.pendingCount);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sourceFilter, publishedFilter, imageFilter, sortBy, sortDir, debouncedSearch]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    const saved = localStorage.getItem("admin-view-mode") as "list" | "gallery" | null;
    if (saved === "gallery") setViewMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("admin-page-size", String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, sourceFilter, publishedFilter, imageFilter, debouncedSearch]);

  function handleSourceChange(source: string) {
    setSourceFilter(source);
    setPage(1);
  }

  function handleImageFilterChange(value: string) {
    setImageFilter(value);
    setPage(1);
  }

  function handlePublishedChange(value: string) {
    setPublishedFilter(value);
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
    if (sortBy !== field)
      return <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-orange-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-orange-600" />
    );
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === recipes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recipes.map((r) => r.id)));
    }
  }

  async function handleBulkAction(published: boolean) {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], published }),
      });
      if (res.ok) {
        setSelected(new Set());
        fetchRecipes();
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkImageStatus(imageStatus: string) {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], imageStatus }),
      });
      if (res.ok) {
        setSelected(new Set());
        fetchRecipes();
      }
    } catch (err) {
      console.error("Bulk image status update failed:", err);
    } finally {
      setActionLoading(false);
    }
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

  async function handleApprove(id: number) {
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], published: true }),
      });
      if (res.ok) fetchRecipes();
    } catch (err) {
      console.error("Approve failed:", err);
    }
  }

  const totalAll =
    (counts.ai || 0) + (counts.csv || 0) + (counts.manual || 0) + (counts.external || 0);

  const filterBtn = (label: string, value: string, count?: number) => (
    <button
      onClick={() => handleSourceChange(value)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        sourceFilter === value
          ? "bg-orange-600 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
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
      case "external":
        return (
          <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
            External
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Manual
          </span>
        );
    }
  };

  const statusLabel = (published: boolean) =>
    published ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <Eye className="h-3 w-3" /> Live
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        <EyeOff className="h-3 w-3" /> Pending
      </span>
    );

  const imageStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <ImageIcon className="h-3 w-3" /> Queued
          </span>
        );
      case "generated":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <ImageIcon className="h-3 w-3" /> Generated
          </span>
        );
      case "skip":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            <ImageIcon className="h-3 w-3" /> Skip
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              searchInputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => handlePublishedChange("")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            publishedFilter === ""
              ? "bg-neutral-800 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => handlePublishedChange("false")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            publishedFilter === "false"
              ? "bg-orange-600 text-white"
              : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
          }`}
        >
          Pending Review
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-orange-700 px-1.5 py-0.5 text-xs text-white min-w-[20px]">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handlePublishedChange("true")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            publishedFilter === "true"
              ? "bg-green-600 text-white"
              : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
          }`}
        >
          Published
        </button>
      </div>

      {/* Image status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide mr-1">Image</span>
        {[
          { label: "All", value: "" },
          { label: "Generated", value: "generated" },
          { label: "Queued", value: "pending" },
          { label: "Skip", value: "skip" },
          { label: "None", value: "none" },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleImageFilterChange(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              imageFilter === value
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Source filter pills + view toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {filterBtn("All Sources", "", totalAll)}
        {filterBtn("AI Generated", "ai", counts.ai)}
        {filterBtn("External", "external", counts.external)}
        {filterBtn("CSV Import", "csv", counts.csv)}
        {filterBtn("Manual", "manual", counts.manual)}
        <div className="ml-auto flex items-center rounded-lg border border-neutral-200 overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"}`}
            title="List view"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("gallery")}
            className={`p-2 transition-colors ${viewMode === "gallery" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"}`}
            title="Gallery view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
          <span className="text-sm font-medium text-neutral-700">
            {selected.size} selected
          </span>
          <button
            onClick={() => handleBulkAction(true)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => handleBulkAction(false)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-300 disabled:opacity-50 transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" /> Unpublish
          </button>
          <span className="mx-1 text-neutral-300">|</span>
          <button
            onClick={() => handleBulkImageStatus("pending")}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Queue for Image Gen
          </button>
          <button
            onClick={() => handleBulkImageStatus("skip")}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Skip Image
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-4 text-sm text-neutral-500">
        Showing {recipes.length} of {total} recipes
        {sourceFilter && (
          <span>
            {" "}
            (filtered by{" "}
            <strong>
              {sourceFilter === "ai"
                ? "AI Generated"
                : sourceFilter === "external"
                  ? "External"
                  : sourceFilter === "csv"
                    ? "CSV Import"
                    : "Manual"}
            </strong>
            )
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="py-12 text-center text-neutral-400">
          No recipes found.
        </div>
      ) : viewMode === "gallery" ? (
        /* Gallery View */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`group relative rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
                selected.has(recipe.id)
                  ? "border-orange-500 ring-2 ring-orange-200"
                  : !recipe.published
                    ? "border-orange-200 bg-orange-50/30"
                    : "border-neutral-200"
              }`}
            >
              {/* Checkbox overlay */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selected.has(recipe.id)}
                  onChange={() => toggleSelect(recipe.id)}
                  className="h-5 w-5 rounded border-2 border-white/80 bg-white/60 text-orange-600 focus:ring-orange-500 shadow-sm cursor-pointer"
                />
              </div>
              {/* Status badge overlay */}
              <div className="absolute top-2 right-2 z-10">
                {statusLabel(recipe.published)}
              </div>
              {/* Image */}
              <a href={`/recipes/${recipe.slug}`} target="_blank" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.heroImage}
                  alt={recipe.title}
                  className="aspect-square w-full object-cover"
                />
              </a>
              {/* Info */}
              <div className="p-3">
                <a
                  href={`/recipes/${recipe.slug}`}
                  target="_blank"
                  className="block text-sm font-medium text-neutral-800 hover:text-orange-600 transition-colors line-clamp-2 leading-snug"
                >
                  {recipe.title}
                </a>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {sourceLabel(recipe.source)}
                  {imageStatusLabel(recipe.imageStatus)}
                </div>
                {recipe.categories.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {recipe.categories.map((c) => (
                      <span
                        key={c.category.name}
                        className="inline-flex items-center rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500"
                      >
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                )}
                {/* Action buttons */}
                <div className="mt-2 flex items-center gap-1.5">
                  {!recipe.published && (
                    <button
                      onClick={() => handleApprove(recipe.id)}
                      className="rounded-md bg-green-50 p-1.5 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                      title="Approve & publish"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <a
                    href={`/admin/recipes/${recipe.id}/edit`}
                    className="rounded-md bg-neutral-50 p-1.5 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    title="Edit recipe"
                  >
                    <Pencil className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(recipe.id, recipe.title)}
                    className="rounded-md bg-neutral-50 p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                    title="Delete recipe"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View (Table) */
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      recipes.length > 0 && selected.size === recipes.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">
                  <button
                    onClick={() => handleSort("title")}
                    className="inline-flex items-center gap-1.5 hover:text-orange-700 transition-colors"
                  >
                    Recipe {sortIcon("title")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 w-20">
                  <button
                    onClick={() => handleSort("source")}
                    className="inline-flex items-center gap-1.5 hover:text-orange-700 transition-colors"
                  >
                    Source {sortIcon("source")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 w-32 hidden xl:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 w-24 hidden lg:table-cell">
                  Image
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden md:table-cell w-28">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="inline-flex items-center gap-1.5 hover:text-orange-700 transition-colors"
                  >
                    Created {sortIcon("createdAt")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recipes.map((recipe) => (
                <tr
                  key={recipe.id}
                  className={`hover:bg-neutral-50 ${!recipe.published ? "bg-orange-50/30" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(recipe.id)}
                      onChange={() => toggleSelect(recipe.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={recipe.heroImage}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-neutral-200"
                      />
                      <a
                        href={`/recipes/${recipe.slug}`}
                        target="_blank"
                        className="font-medium text-neutral-800 hover:text-orange-600 transition-colors line-clamp-1"
                      >
                        {recipe.title}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">{sourceLabel(recipe.source)}</td>
                  <td className="px-4 py-3">
                    {statusLabel(recipe.published)}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {recipe.categories.length > 0 ? (
                        recipe.categories.map((c) => (
                          <span
                            key={c.category.name}
                            className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"
                          >
                            {c.category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-300">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {imageStatusLabel(recipe.imageStatus)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {!recipe.published && (
                        <button
                          onClick={() => handleApprove(recipe.id)}
                          className="rounded-md bg-green-50 p-1.5 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                          title="Approve & publish"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <a
                        href={`/admin/recipes/${recipe.id}/edit`}
                        className="rounded-md bg-neutral-50 p-1.5 text-neutral-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        title="Edit recipe"
                      >
                        <Pencil className="h-4 w-4" />
                      </a>
                      <a
                        href={`/recipes/${recipe.slug}`}
                        target="_blank"
                        className="rounded-md bg-neutral-50 p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                        title="View recipe"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        className="rounded-md bg-neutral-50 p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <span className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <label htmlFor="page-size" className="text-sm text-neutral-500">Show</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              {[25, 50, 100, 200].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
