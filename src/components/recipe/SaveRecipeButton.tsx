"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useSavedRecipes } from "./SavedRecipesProvider";

interface SaveRecipeButtonProps {
  recipeId: number;
}

export function SaveRecipeButton({ recipeId }: SaveRecipeButtonProps) {
  const { data: session, status } = useSession();
  const { savedIds, refresh } = useSavedRecipes();
  const [loading, setLoading] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const saved = optimistic ?? savedIds.has(recipeId);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    setOptimistic(!saved);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/save`, {
        method: "POST",
      });

      if (!res.ok) {
        setOptimistic(null);
        return;
      }

      const data = await res.json();
      setOptimistic(null);
      refresh();
    } catch {
      setOptimistic(null);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;

  if (!session) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 rounded-lg transition-colors"
      >
        <Heart className="h-4 w-4" />
        <span>Save</span>
      </Link>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        saved
          ? "text-red-600 bg-red-50 hover:bg-red-100"
          : "text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`}
      />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
