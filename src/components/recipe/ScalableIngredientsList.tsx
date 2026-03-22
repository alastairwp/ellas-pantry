"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, RotateCcw, ArrowLeftRight, HelpCircle, X } from "lucide-react";
import { CopyIngredientsButton } from "./CopyIngredientsButton";
import { MissingSubstitutionsPanel } from "./MissingSubstitutionsPanel";
import { toFraction } from "@/lib/utils";
import { convertUnit, type UnitSystem } from "@/lib/unit-conversion";
import type { MissingSubstitutionsResult } from "@/lib/generate-missing-substitutions";

interface IngredientItem {
  quantity: string;
  unit: string | null;
  notes: string | null;
  ingredient: {
    name: string;
  };
}

interface ScalableIngredientsListProps {
  ingredients: IngredientItem[];
  originalServings: number;
  recipeId: number;
  recipeTitle: string;
}

function scaleQuantity(quantity: string, ratio: number): string {
  const num = parseFloat(quantity);
  if (isNaN(num)) return quantity;
  const scaled = num * ratio;
  // Round to 2 decimal places to avoid floating point noise
  return String(Math.round(scaled * 100) / 100);
}

export function ScalableIngredientsList({
  ingredients,
  originalServings,
  recipeId,
  recipeTitle,
}: ScalableIngredientsListProps) {
  const [servings, setServings] = useState(originalServings);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [missingMode, setMissingMode] = useState(false);
  const [missingSet, setMissingSet] = useState<Set<string>>(new Set());
  const [subResult, setSubResult] = useState<MissingSubstitutionsResult | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const ratio = servings / originalServings;
  const isScaled = servings !== originalServings;

  useEffect(() => {
    const stored = localStorage.getItem("recipebox-unit-system");
    if (stored === "imperial" || stored === "metric") {
      setUnitSystem(stored);
    }
  }, []);

  const toggleUnits = () => {
    const next = unitSystem === "metric" ? "imperial" : "metric";
    setUnitSystem(next);
    localStorage.setItem("recipebox-unit-system", next);
  };

  const toggleMissing = (name: string) => {
    setMissingSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    // Clear previous results when selection changes
    setSubResult(null);
    setSubError(null);
  };

  const exitMissingMode = () => {
    setMissingMode(false);
    setMissingSet(new Set());
    setSubResult(null);
    setSubError(null);
  };

  async function fetchMissingSubstitutions() {
    const missing = Array.from(missingSet);
    if (missing.length === 0) return;

    setSubLoading(true);
    setSubError(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/missing-substitutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missingIngredients: missing }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data: MissingSubstitutionsResult = await res.json();
      setSubResult(data);
    } catch {
      setSubError("Could not generate substitutions. Please try again.");
    } finally {
      setSubLoading(false);
    }
  }

  const scaledIngredients = ingredients.map((item) => {
    const scaledQty = scaleQuantity(item.quantity, ratio);
    const converted = convertUnit(scaledQty, item.unit, unitSystem);
    return { ...item, quantity: converted.quantity, unit: converted.unit };
  });

  return (
    <div className="print-ingredients">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-stone-800">Ingredients</h2>
        <CopyIngredientsButton ingredients={scaledIngredients} />
      </div>

      {/* Servings adjuster */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-stone-50 rounded-lg">
        <span className="text-sm font-medium text-stone-600">Servings:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServings(Math.max(1, servings - 1))}
            disabled={servings <= 1}
            className="h-8 w-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-stone-300 disabled:hover:text-stone-600 transition-colors"
            aria-label="Decrease servings"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-lg font-semibold text-stone-800">
            {servings}
          </span>
          <button
            onClick={() => setServings(servings + 1)}
            className="h-8 w-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 transition-colors"
            aria-label="Increase servings"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {isScaled && (
          <button
            onClick={() => setServings(originalServings)}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-amber-700 transition-colors"
            aria-label="Reset to original servings"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
        <button
          onClick={toggleUnits}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-amber-700 bg-white border border-stone-200 hover:border-amber-300 rounded-lg transition-colors"
          aria-label={`Switch to ${unitSystem === "metric" ? "imperial" : "metric"} units`}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {unitSystem === "metric" ? "Imperial" : "Metric"}
        </button>
      </div>

      {/* Missing mode toggle */}
      <div className="mb-4 no-print">
        {missingMode ? (
          <div className="flex items-start justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-amber-800">
                Are you missing any ingredients?
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Tick the ingredients you don&apos;t have, then press &quot;Get Substitutes&quot; for AI-powered alternatives.
              </p>
            </div>
            <button
              onClick={exitMissingMode}
              className="shrink-0 p-1 text-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Exit missing ingredient mode"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMissingMode(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Are you missing any ingredients?
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {scaledIngredients.map((item, index) => {
          const isMissing = missingSet.has(item.ingredient.name);
          return (
            <li
              key={index}
              className={`flex items-baseline gap-1 py-1.5 border-b border-stone-100 last:border-b-0 ${
                isMissing
                  ? "bg-orange-50 -mx-2 px-2 rounded text-orange-700 border-orange-100"
                  : "text-stone-700"
              }`}
            >
              {missingMode && (
                <input
                  type="checkbox"
                  checked={isMissing}
                  onChange={() => toggleMissing(item.ingredient.name)}
                  className="mr-1.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 self-center shrink-0"
                />
              )}
              <span
                className={`font-medium ${
                  isMissing
                    ? "text-orange-700"
                    : isScaled
                      ? "text-amber-700"
                      : ""
                }`}
              >
                {toFraction(item.quantity)}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
              <span>{item.ingredient.name}</span>
              {item.notes && (
                <span className="text-sm text-stone-400">({item.notes})</span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Get Substitutes button */}
      {missingMode && missingSet.size > 0 && (
        <button
          onClick={fetchMissingSubstitutions}
          disabled={subLoading}
          className="mt-4 w-full px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {subLoading
            ? "Finding substitutions..."
            : `Get Substitutes for ${missingSet.size} ingredient${missingSet.size > 1 ? "s" : ""}`}
        </button>
      )}

      <MissingSubstitutionsPanel
        result={subResult}
        loading={subLoading}
        error={subError}
      />
    </div>
  );
}
