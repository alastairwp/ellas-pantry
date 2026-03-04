"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, RotateCcw, ArrowLeftRight } from "lucide-react";
import { CopyIngredientsButton } from "./CopyIngredientsButton";
import { toFraction } from "@/lib/utils";
import { convertUnit, type UnitSystem } from "@/lib/unit-conversion";

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
}: ScalableIngredientsListProps) {
  const [servings, setServings] = useState(originalServings);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
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

      <ul className="space-y-2">
        {scaledIngredients.map((item, index) => (
          <li
            key={index}
            className="flex items-baseline gap-1 py-1.5 border-b border-stone-100 last:border-b-0 text-stone-700"
          >
            <span className={`font-medium ${isScaled ? "text-amber-700" : ""}`}>
              {toFraction(item.quantity)}
              {item.unit ? ` ${item.unit}` : ""}
            </span>
            <span>{item.ingredient.name}</span>
            {item.notes && (
              <span className="text-sm text-stone-400">({item.notes})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
