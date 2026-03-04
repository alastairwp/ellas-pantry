"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Lightbulb } from "lucide-react";

interface Substitution {
  original: string;
  replacement: string;
  quantity: string;
  notes: string;
}

interface SubstitutionResult {
  type: string;
  suggestions: Substitution[];
  tips: string;
}

interface SubstitutionsPanelProps {
  recipeId: number;
  dietaryTags: string[];
}

const VARIATION_TYPES = [
  { key: "vegan", label: "Vegan", hideIfTag: "vegan" },
  { key: "gluten-free", label: "Gluten-Free", hideIfTag: "gluten-free" },
  { key: "dairy-free", label: "Dairy-Free", hideIfTag: "dairy-free" },
  { key: "budget", label: "Budget", hideIfTag: null },
];

export function SubstitutionsPanel({
  recipeId,
  dietaryTags,
}: SubstitutionsPanelProps) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Record<string, SubstitutionResult>>({});
  const [error, setError] = useState<string | null>(null);

  const tagSlugs = dietaryTags.map((t) => t.toLowerCase());

  const availableTypes = VARIATION_TYPES.filter(
    (v) => !v.hideIfTag || !tagSlugs.includes(v.hideIfTag)
  );

  if (availableTypes.length === 0) return null;

  async function fetchSubstitutions(type: string) {
    if (cache[type]) {
      setActiveType(type);
      return;
    }

    setActiveType(type);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/substitutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data: SubstitutionResult = await res.json();
      setCache((prev) => ({ ...prev, [type]: data }));
    } catch {
      setError("Could not generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const result = activeType ? cache[activeType] : null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-stone-800 mb-4">
        Recipe Variations
      </h2>
      <p className="text-sm text-stone-500 mb-4">
        Get AI-powered ingredient substitution suggestions.
      </p>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {availableTypes.map((v) => (
          <button
            key={v.key}
            onClick={() => fetchSubstitutions(v.key)}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
              activeType === v.key
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-stone-300 text-stone-600 hover:border-amber-400 hover:text-amber-700"
            } disabled:opacity-50`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-stone-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating suggestions...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-sm text-red-600 py-2">{error}</p>
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {result.suggestions.length === 0 ? (
            <p className="text-sm text-stone-500 py-2">
              No substitutions needed — this recipe is already compatible!
            </p>
          ) : (
            <div className="space-y-3">
              {result.suggestions.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-stone-200 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-stone-600 line-through">
                        {sub.original}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold text-amber-700">
                        {sub.replacement}
                      </span>
                    </div>
                    {sub.quantity && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        Quantity: {sub.quantity}
                      </p>
                    )}
                    {sub.notes && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {sub.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.tips && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">{result.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
