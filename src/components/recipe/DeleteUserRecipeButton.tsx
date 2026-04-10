"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

interface Props {
  recipeId: number;
  recipeTitle: string;
}

export function DeleteUserRecipeButton({ recipeId, recipeTitle }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${recipeTitle}"? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/user-recipes/${recipeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not delete recipe");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      alert("Could not delete recipe");
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur text-red-600 text-xs font-medium rounded-full shadow-sm hover:bg-white disabled:opacity-50"
      aria-label={`Delete ${recipeTitle}`}
    >
      {deleting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Delete
    </button>
  );
}
