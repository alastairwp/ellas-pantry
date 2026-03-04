"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface IngredientItem {
  quantity: string;
  unit: string | null;
  notes: string | null;
  ingredient: {
    name: string;
  };
}

interface CopyIngredientsButtonProps {
  ingredients: IngredientItem[];
}

export function CopyIngredientsButton({
  ingredients,
}: CopyIngredientsButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = ingredients
      .map((item) => {
        let line = item.quantity;
        if (item.unit) line += ` ${item.unit}`;
        line += ` ${item.ingredient.name}`;
        if (item.notes) line += ` (${item.notes})`;
        return line;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available; fall back silently
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 rounded-lg transition-colors no-print"
      aria-label="Copy ingredients to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
