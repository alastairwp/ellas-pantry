"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, ExternalLink, ChevronDown, ChevronRight, Loader2, AlertTriangle, X } from "lucide-react";

interface DuplicateRecipe {
  id: number;
  slug: string;
  title: string;
  source: string;
  heroImage: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  createdAt: string;
  ingredients: { ingredient: { name: string }; quantity: string; unit: string }[];
  steps: { stepNumber: number; instruction: string }[];
}

interface DuplicateGroup {
  title: string;
  source: string;
  count: number;
  recipes: DuplicateRecipe[];
}

interface DuplicatesResponse {
  totalGroups: number;
  totalDuplicates: number;
  groups: DuplicateGroup[];
}

export function Duplicates() {
  const [data, setData] = useState<DuplicatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [pendingGroup, setPendingGroup] = useState<DuplicateGroup | null>(null);

  const fetchDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/duplicates");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch duplicates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  function groupKey(g: DuplicateGroup) {
    return `${g.source}::${g.title}`;
  }

  function toggleGroup(g: DuplicateGroup) {
    const key = groupKey(g);
    setExpandedGroup((prev) => (prev === key ? null : key));
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete duplicate "${title}" (ID: ${id})? This cannot be undone.`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Refresh the list
        await fetchDuplicates();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  }

  function handleDeleteAllButFirst(group: DuplicateGroup) {
    if (skipConfirm) {
      executeDeleteAllButFirst(group);
    } else {
      setPendingGroup(group);
    }
  }

  async function executeDeleteAllButFirst(group: DuplicateGroup) {
    const toDelete = group.recipes.slice(1);
    for (const recipe of toDelete) {
      setDeleting(recipe.id);
      try {
        await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      } catch (err) {
        console.error(`Failed to delete ${recipe.id}:`, err);
      }
    }
    setDeleting(null);
    await fetchDuplicates();
  }

  async function handleDeleteAllDuplicates() {
    if (!data || data.groups.length === 0) return;
    const totalToDelete = data.groups.reduce((sum, g) => sum + g.count - 1, 0);
    if (
      !confirm(
        `Delete ${totalToDelete} duplicate recipe(s) across ${data.totalGroups} group(s)? The oldest recipe in each group will be kept. This cannot be undone.`
      )
    )
      return;

    setLoading(true);
    for (const group of data.groups) {
      const toDelete = group.recipes.slice(1);
      for (const recipe of toDelete) {
        try {
          await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
        } catch (err) {
          console.error(`Failed to delete ${recipe.id}:`, err);
        }
      }
    }
    await fetchDuplicates();
  }

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

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-400">
        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
        Scanning for duplicates...
      </div>
    );
  }

  if (!data || data.groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-stone-500 text-lg">No duplicates found</p>
        <p className="text-stone-400 text-sm mt-1">
          All recipes with the same source have unique titles.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <div className="text-sm text-stone-700">
          Found <strong className="text-amber-700">{data.totalGroups}</strong> duplicate group{data.totalGroups !== 1 && "s"} with{" "}
          <strong className="text-amber-700">{data.totalDuplicates}</strong> extra recipe{data.totalDuplicates !== 1 && "s"} that can be removed.
        </div>
        <button
          onClick={handleDeleteAllDuplicates}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Remove All Duplicates
        </button>
      </div>

      {/* Confirm modal */}
      {pendingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Delete duplicates</h3>
                <p className="text-sm text-stone-500">This cannot be undone</p>
              </div>
              <button
                onClick={() => setPendingGroup(null)}
                className="ml-auto text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-stone-700">
                Delete{" "}
                <strong>{pendingGroup.recipes.length - 1} duplicate{pendingGroup.recipes.length - 1 !== 1 && "s"}</strong>{" "}
                of <strong>&ldquo;{pendingGroup.title}&rdquo;</strong> and keep the oldest copy?
              </p>

              <label className="mt-4 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipConfirm}
                  onChange={(e) => setSkipConfirm(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-600">
                  Don&apos;t ask me every time
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-stone-200 px-5 py-4">
              <button
                onClick={() => setPendingGroup(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const group = pendingGroup;
                  setPendingGroup(null);
                  executeDeleteAllButFirst(group);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete duplicates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate groups */}
      <div className="space-y-3">
        {data.groups.map((group) => {
          const key = groupKey(group);
          const isExpanded = expandedGroup === key;

          return (
            <div
              key={key}
              className="rounded-lg border border-stone-200 overflow-hidden"
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-stone-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-stone-400" />
                  )}
                  <span className="font-medium text-stone-800">
                    {group.title}
                  </span>
                  {sourceLabel(group.source)}
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {group.count} copies
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAllButFirst(group);
                  }}
                  className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                  Keep oldest, delete rest
                </button>
              </button>

              {/* Expanded comparison */}
              {isExpanded && (
                <div className="divide-y divide-stone-100">
                  {group.recipes.map((recipe, idx) => (
                    <div
                      key={recipe.id}
                      className={`px-4 py-4 ${idx === 0 ? "bg-green-50/50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {idx === 0 && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                Oldest
                              </span>
                            )}
                            <span className="text-xs text-stone-400">
                              ID: {recipe.id} &middot; Created:{" "}
                              {new Date(recipe.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-sm text-stone-600 line-clamp-2 mb-2">
                            {recipe.description}
                          </p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                            <span>Prep: {recipe.prepTime}min</span>
                            <span>Cook: {recipe.cookTime}min</span>
                            <span>Servings: {recipe.servings}</span>
                            <span>
                              Ingredients: {recipe.ingredients.length}
                            </span>
                            <span>Steps: {recipe.steps.length}</span>
                          </div>
                        </div>

                        {/* Recipe thumbnail */}
                        {recipe.heroImage && !recipe.heroImage.includes("placehold") && (
                          <img
                            src={recipe.heroImage}
                            alt=""
                            className="h-16 w-24 rounded-md object-cover flex-shrink-0"
                          />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                            disabled={deleting === recipe.id}
                            className="text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete this copy"
                          >
                            {deleting === recipe.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
