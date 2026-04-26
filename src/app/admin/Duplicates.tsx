"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
  GitCompare,
  Copy,
  FileWarning,
} from "lucide-react";

/* ───────── Shared types ───────── */

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

/* ───────── Similar types ───────── */

interface SimilarRecipe {
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
  ingredients: string[];
}

interface SimilarGroup {
  confidence: number;
  titleSimilarity: number;
  ingredientSimilarity: number;
  sharedIngredients: string[];
  recipes: SimilarRecipe[];
}

interface SimilarResponse {
  totalGroups: number;
  totalSimilar: number;
  groups: SimilarGroup[];
}

/* ───────── Helpers ───────── */

function sourceLabel(source: string) {
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
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
          Manual
        </span>
      );
  }
}

function confidenceBadge(pct: number) {
  const color =
    pct >= 80
      ? "bg-red-100 text-red-700"
      : pct >= 60
        ? "bg-orange-100 text-orange-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {pct}% similar
    </span>
  );
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export function Duplicates() {
  const [tab, setTab] = useState<"exact" | "similar" | "thin">("thin");

  const tabClass = (t: string) =>
    `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
      tab === t
        ? "border-orange-500 text-orange-700"
        : "border-transparent text-neutral-500 hover:text-neutral-700"
    }`;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-2 border-b border-neutral-200">
        <button onClick={() => setTab("thin")} className={tabClass("thin")}>
          <FileWarning className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Thin Content
        </button>
        <button onClick={() => setTab("similar")} className={tabClass("similar")}>
          <GitCompare className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Similar Recipes
        </button>
        <button onClick={() => setTab("exact")} className={tabClass("exact")}>
          <Copy className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Exact Duplicates
        </button>
      </div>

      {tab === "thin" && <ThinContent />}
      {tab === "similar" && <SimilarDuplicates />}
      {tab === "exact" && <ExactDuplicates />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Thin Content Tab
   ═══════════════════════════════════════════════ */

interface ThinRecipe {
  id: number;
  slug: string;
  title: string;
  source: string;
  heroImage: string;
  categories: string[];
  contentScore: number;
  descriptionLength: number;
  descriptionIsStep: boolean;
  hasIntro: boolean;
  stepCount: number;
  totalStepWords: number;
  ingredientCount: number;
  hasImage: boolean;
  issues: string[];
}

interface ThinResponse {
  totalFlagged: number;
  totalPublished: number;
  recipes: ThinRecipe[];
}

function ThinContent() {
  const [data, setData] = useState<ThinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "steps" | "description">("score");
  const pageSize = 50;

  const fetchThin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/duplicates/thin");
      setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch thin content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThin();
  }, [fetchThin]);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}" (ID: ${id})? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) await fetchThin();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  }

  async function handleUnpublish(id: number) {
    try {
      await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: false }),
      });
      await fetchThin();
    } catch (err) {
      console.error("Unpublish failed:", err);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
        Analysing content quality...
      </div>
    );
  }

  if (!data || data.recipes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500 text-lg">No thin content found</p>
        <p className="text-neutral-400 text-sm mt-1">All published recipes have sufficient content depth.</p>
      </div>
    );
  }

  const sorted = [...data.recipes].sort((a, b) => {
    if (sortBy === "score") return a.contentScore - b.contentScore;
    if (sortBy === "steps") return a.stepCount - b.stepCount;
    return a.descriptionLength - b.descriptionLength;
  });

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  function scoreBadge(score: number) {
    const color =
      score < 20
        ? "bg-red-100 text-red-700"
        : score < 35
          ? "bg-orange-100 text-orange-700"
          : "bg-yellow-100 text-yellow-700";
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
        {score}/100
      </span>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
        <p className="text-sm text-neutral-700">
          <strong className="text-orange-700">{data.totalFlagged}</strong> of{" "}
          <strong>{data.totalPublished}</strong> published recipes have thin content that Google
          may flag as duplicate or low-quality pages. These recipes have short descriptions,
          few steps, or missing introductions.
        </p>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-neutral-500">Sort by:</span>
        {(["score", "steps", "description"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSortBy(s); setPage(0); }}
            className={`text-sm px-2 py-1 rounded ${
              sortBy === s ? "bg-orange-100 text-orange-700 font-medium" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {s === "score" ? "Content Score" : s === "steps" ? "Step Count" : "Description Length"}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-neutral-600 text-left">
              <th className="px-3 py-2 font-medium">Recipe</th>
              <th className="px-3 py-2 font-medium w-20 text-center">Score</th>
              <th className="px-3 py-2 font-medium w-16 text-center hidden sm:table-cell">Steps</th>
              <th className="px-3 py-2 font-medium w-16 text-center hidden md:table-cell">Ings</th>
              <th className="px-3 py-2 font-medium w-20 text-center hidden md:table-cell">Desc</th>
              <th className="px-3 py-2 font-medium hidden lg:table-cell">Issues</th>
              <th className="px-3 py-2 font-medium w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paged.map((recipe) => (
              <tr key={recipe.id} className="hover:bg-neutral-50/50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-800 truncate max-w-xs">
                      {recipe.title}
                    </span>
                    {sourceLabel(recipe.source)}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {recipe.categories.join(", ") || "No category"} &middot; ID: {recipe.id}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">{scoreBadge(recipe.contentScore)}</td>
                <td className="px-3 py-2.5 text-center text-neutral-600 hidden sm:table-cell">
                  {recipe.stepCount}
                  <span className="text-xs text-neutral-400 block">{recipe.totalStepWords}w</span>
                </td>
                <td className="px-3 py-2.5 text-center text-neutral-600 hidden md:table-cell">
                  {recipe.ingredientCount}
                </td>
                <td className="px-3 py-2.5 text-center text-neutral-600 hidden md:table-cell">
                  {recipe.descriptionLength}c
                  {recipe.descriptionIsStep && (
                    <span className="block text-xs text-orange-500">step 1</span>
                  )}
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {recipe.issues.map((issue) => (
                      <span
                        key={issue}
                        className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <a
                      href={`/recipes/${recipe.slug}`}
                      target="_blank"
                      className="text-neutral-400 hover:text-orange-600 transition-colors"
                      title="View"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`/admin/recipes/${recipe.id}/edit`}
                      target="_blank"
                      className="text-xs text-neutral-400 hover:text-orange-600 underline"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleUnpublish(recipe.id)}
                      className="text-xs text-neutral-400 hover:text-orange-600 underline"
                      title="Unpublish"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id, recipe.title)}
                      disabled={deleting === recipe.id}
                      className="text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === recipe.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-neutral-500">
          <span>
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded border border-neutral-300 px-3 py-1 disabled:opacity-30 hover:bg-neutral-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-neutral-300 px-3 py-1 disabled:opacity-30 hover:bg-neutral-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Similar Duplicates Tab
   ═══════════════════════════════════════════════ */

function SimilarDuplicates() {
  const [data, setData] = useState<SimilarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [comparing, setComparing] = useState<{ groupIdx: number; ids: [number, number] } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchSimilar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/duplicates/similar");
      setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch similar recipes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimilar();
  }, [fetchSimilar]);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}" (ID: ${id})? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) await fetchSimilar();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
      setComparing(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
        Analysing recipe similarity...
      </div>
    );
  }

  if (!data || data.groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500 text-lg">No similar recipes found</p>
        <p className="text-neutral-400 text-sm mt-1">
          All published recipes look sufficiently distinct.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-neutral-700">
        Found <strong className="text-orange-700">{data.totalGroups}</strong> group{data.totalGroups !== 1 && "s"} of similar recipes
        (<strong className="text-orange-700">{data.totalSimilar}</strong> potential duplicate{data.totalSimilar !== 1 && "s"}).
        Review each group and choose which to keep.
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {data.groups.map((group, gIdx) => {
          const isExpanded = expandedGroup === gIdx;
          const isComparing = comparing?.groupIdx === gIdx;

          return (
            <div
              key={gIdx}
              className="rounded-lg border border-neutral-200 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : gIdx)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  )}
                  <span className="font-medium text-neutral-800">
                    {group.recipes.map((r) => r.title).filter((t, i, a) => a.indexOf(t) === i).join(" / ")}
                  </span>
                  {confidenceBadge(group.confidence)}
                  <span className="text-xs text-neutral-400">
                    Title: {group.titleSimilarity}% &middot; Ingredients: {group.ingredientSimilarity}%
                  </span>
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {group.recipes.length} recipes
                  </span>
                </div>
              </button>

              {/* Expanded: recipe list */}
              {isExpanded && !isComparing && (
                <div className="divide-y divide-neutral-100">
                  {group.recipes.map((recipe) => (
                    <div key={recipe.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-neutral-800 text-sm">{recipe.title}</span>
                            {sourceLabel(recipe.source)}
                            <span className="text-xs text-neutral-400">
                              ID: {recipe.id} &middot;{" "}
                              {new Date(recipe.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                            {recipe.description}
                          </p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 mb-2">
                            <span>Prep: {recipe.prepTime}min</span>
                            <span>Cook: {recipe.cookTime}min</span>
                            <span>Servings: {recipe.servings}</span>
                            <span>Ingredients: {recipe.ingredients.length}</span>
                          </div>

                          {/* Ingredient pills */}
                          <div className="flex flex-wrap gap-1">
                            {recipe.ingredients.map((ing) => {
                              const isShared = group.sharedIngredients.includes(ing);
                              return (
                                <span
                                  key={ing}
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    isShared
                                      ? "bg-green-100 text-green-700"
                                      : "bg-neutral-100 text-neutral-500"
                                  }`}
                                >
                                  {ing}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {recipe.heroImage && !recipe.heroImage.includes("placehold") && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={recipe.heroImage}
                            alt=""
                            className="h-16 w-24 rounded-md object-cover flex-shrink-0"
                          />
                        )}

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={`/recipes/${recipe.slug}`}
                            target="_blank"
                            className="text-neutral-400 hover:text-orange-600 transition-colors"
                            title="View recipe"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <a
                            href={`/admin?tab=recipes&edit=${recipe.id}`}
                            target="_blank"
                            className="text-neutral-400 hover:text-orange-600 transition-colors text-xs underline"
                            title="Edit recipe"
                          >
                            Edit
                          </a>
                          <button
                            onClick={() => handleDelete(recipe.id, recipe.title)}
                            disabled={deleting === recipe.id}
                            className="text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete this recipe"
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

                  {/* Compare button */}
                  {group.recipes.length >= 2 && (
                    <div className="px-4 py-3 bg-neutral-50">
                      <button
                        onClick={() =>
                          setComparing({
                            groupIdx: gIdx,
                            ids: [group.recipes[0].id, group.recipes[1].id],
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-200 transition-colors"
                      >
                        <GitCompare className="h-4 w-4" />
                        Compare side by side
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Side-by-side comparison */}
              {isExpanded && isComparing && (
                <CompareView
                  group={group}
                  selectedIds={comparing.ids}
                  onChangeSelection={(ids) =>
                    setComparing({ groupIdx: gIdx, ids })
                  }
                  onBack={() => setComparing(null)}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Side-by-side Compare View ───────── */

function CompareView({
  group,
  selectedIds,
  onChangeSelection,
  onBack,
  onDelete,
  deleting,
}: {
  group: SimilarGroup;
  selectedIds: [number, number];
  onChangeSelection: (ids: [number, number]) => void;
  onBack: () => void;
  onDelete: (id: number, title: string) => void;
  deleting: number | null;
}) {
  const left = group.recipes.find((r) => r.id === selectedIds[0])!;
  const right = group.recipes.find((r) => r.id === selectedIds[1])!;

  if (!left || !right) return null;

  const leftIngs = new Set(left.ingredients);
  const rightIngs = new Set(right.ingredients);
  const allIngs = [...new Set([...left.ingredients, ...right.ingredients])].sort();

  const fields: { label: string; left: string; right: string }[] = [
    { label: "Title", left: left.title, right: right.title },
    { label: "Prep Time", left: `${left.prepTime} min`, right: `${right.prepTime} min` },
    { label: "Cook Time", left: `${left.cookTime} min`, right: `${right.cookTime} min` },
    { label: "Servings", left: String(left.servings), right: String(right.servings) },
    { label: "Source", left: left.source, right: right.source },
    {
      label: "Created",
      left: new Date(left.createdAt).toLocaleDateString(),
      right: new Date(right.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          &larr; Back to list
        </button>

        {group.recipes.length > 2 && (
          <div className="flex items-center gap-2 text-sm">
            <label className="text-neutral-500">Left:</label>
            <select
              value={selectedIds[0]}
              onChange={(e) =>
                onChangeSelection([parseInt(e.target.value, 10), selectedIds[1]])
              }
              className="rounded border border-neutral-300 px-2 py-1 text-xs"
            >
              {group.recipes
                .filter((r) => r.id !== selectedIds[1])
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} (#{r.id})
                  </option>
                ))}
            </select>
            <label className="text-neutral-500">Right:</label>
            <select
              value={selectedIds[1]}
              onChange={(e) =>
                onChangeSelection([selectedIds[0], parseInt(e.target.value, 10)])
              }
              className="rounded border border-neutral-300 px-2 py-1 text-xs"
            >
              {group.recipes
                .filter((r) => r.id !== selectedIds[0])
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} (#{r.id})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Field comparison */}
      <div className="rounded-lg border border-neutral-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-neutral-600">
              <th className="px-3 py-2 text-left font-medium w-28">Field</th>
              <th className="px-3 py-2 text-left font-medium">
                #{left.id}
              </th>
              <th className="px-3 py-2 text-left font-medium">
                #{right.id}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {fields.map((f) => (
              <tr
                key={f.label}
                className={f.left !== f.right ? "bg-orange-50/50" : ""}
              >
                <td className="px-3 py-2 text-neutral-500 font-medium">
                  {f.label}
                </td>
                <td className="px-3 py-2 text-neutral-800">{f.left}</td>
                <td className="px-3 py-2 text-neutral-800">{f.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Description comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-xs font-medium text-neutral-500 mb-1">Description (#{left.id})</h4>
          <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 line-clamp-4">
            {left.description}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-medium text-neutral-500 mb-1">Description (#{right.id})</h4>
          <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 line-clamp-4">
            {right.description}
          </p>
        </div>
      </div>

      {/* Ingredient comparison */}
      <h4 className="text-xs font-medium text-neutral-500 mb-2">
        Ingredients ({group.sharedIngredients.length} shared)
      </h4>
      <div className="rounded-lg border border-neutral-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-neutral-600">
              <th className="px-3 py-2 text-left font-medium">Ingredient</th>
              <th className="px-3 py-1.5 text-center font-medium w-20">
                #{left.id}
              </th>
              <th className="px-3 py-1.5 text-center font-medium w-20">
                #{right.id}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {allIngs.map((ing) => {
              const inLeft = leftIngs.has(ing);
              const inRight = rightIngs.has(ing);
              const shared = inLeft && inRight;
              return (
                <tr
                  key={ing}
                  className={shared ? "bg-green-50/50" : "bg-orange-50/50"}
                >
                  <td className="px-3 py-1.5 text-neutral-700">{ing}</td>
                  <td className="px-3 py-1.5 text-center">
                    {inLeft ? (
                      <span className="text-green-600">&#10003;</span>
                    ) : (
                      <span className="text-neutral-300">&mdash;</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {inRight ? (
                      <span className="text-green-600">&#10003;</span>
                    ) : (
                      <span className="text-neutral-300">&mdash;</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete actions */}
      <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
        <span className="text-sm text-neutral-500">Delete:</span>
        <button
          onClick={() => onDelete(left.id, left.title)}
          disabled={deleting === left.id}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting === left.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          #{left.id} &mdash; {left.title}
        </button>
        <button
          onClick={() => onDelete(right.id, right.title)}
          disabled={deleting === right.id}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting === right.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          #{right.id} &mdash; {right.title}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Exact Duplicates Tab (original functionality)
   ═══════════════════════════════════════════════ */

function ExactDuplicates() {
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
      setData(await res.json());
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
      if (res.ok) await fetchDuplicates();
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

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
        Scanning for duplicates...
      </div>
    );
  }

  if (!data || data.groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500 text-lg">No exact duplicates found</p>
        <p className="text-neutral-400 text-sm mt-1">
          All recipes have unique titles within their source.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
        <div className="text-sm text-neutral-700">
          Found <strong className="text-orange-700">{data.totalGroups}</strong> duplicate group{data.totalGroups !== 1 && "s"} with{" "}
          <strong className="text-orange-700">{data.totalDuplicates}</strong> extra recipe{data.totalDuplicates !== 1 && "s"} that can be removed.
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
            <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Delete duplicates</h3>
                <p className="text-sm text-neutral-500">This cannot be undone</p>
              </div>
              <button
                onClick={() => setPendingGroup(null)}
                className="ml-auto text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-neutral-700">
                Delete{" "}
                <strong>{pendingGroup.recipes.length - 1} duplicate{pendingGroup.recipes.length - 1 !== 1 && "s"}</strong>{" "}
                of <strong>&ldquo;{pendingGroup.title}&rdquo;</strong> and keep the oldest copy?
              </p>

              <label className="mt-4 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipConfirm}
                  onChange={(e) => setSkipConfirm(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-neutral-600">Don&apos;t ask me every time</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-5 py-4">
              <button
                onClick={() => setPendingGroup(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
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
            <div key={key} className="rounded-lg border border-neutral-200 overflow-hidden">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  )}
                  <span className="font-medium text-neutral-800">{group.title}</span>
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
                  className="rounded-md bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                  Keep oldest, delete rest
                </button>
              </button>

              {isExpanded && (
                <div className="divide-y divide-neutral-100">
                  {group.recipes.map((recipe, idx) => (
                    <div key={recipe.id} className={`px-4 py-4 ${idx === 0 ? "bg-green-50/50" : ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {idx === 0 && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                Oldest
                              </span>
                            )}
                            <span className="text-xs text-neutral-400">
                              ID: {recipe.id} &middot; Created: {new Date(recipe.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{recipe.description}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                            <span>Prep: {recipe.prepTime}min</span>
                            <span>Cook: {recipe.cookTime}min</span>
                            <span>Servings: {recipe.servings}</span>
                            <span>Ingredients: {recipe.ingredients.length}</span>
                            <span>Steps: {recipe.steps.length}</span>
                          </div>
                        </div>
                        {recipe.heroImage && !recipe.heroImage.includes("placehold") && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={recipe.heroImage} alt="" className="h-16 w-24 rounded-md object-cover flex-shrink-0" />
                        )}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={`/recipes/${recipe.slug}`}
                            target="_blank"
                            className="text-neutral-400 hover:text-orange-600 transition-colors"
                            title="View recipe"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(recipe.id, recipe.title)}
                            disabled={deleting === recipe.id}
                            className="text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
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
