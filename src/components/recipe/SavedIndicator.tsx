"use client";

import { Heart } from "lucide-react";
import { useSavedRecipes } from "./SavedRecipesProvider";

interface SavedIndicatorProps {
  recipeId: number;
}

export function SavedIndicator({ recipeId }: SavedIndicatorProps) {
  const { savedIds } = useSavedRecipes();

  if (!savedIds.has(recipeId)) return null;

  return (
    <div className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow-sm">
      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
    </div>
  );
}
