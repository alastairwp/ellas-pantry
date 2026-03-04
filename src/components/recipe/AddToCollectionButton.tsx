"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FolderPlus, Check, Plus } from "lucide-react";

interface Collection {
  id: number;
  name: string;
}

interface AddToCollectionButtonProps {
  recipeId: number;
}

export function AddToCollectionButton({ recipeId }: AddToCollectionButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberOf, setMemberOf] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  async function fetchCollections() {
    setLoading(true);
    const res = await fetch("/api/collections");
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections);

      // Check which collections contain this recipe
      const ids = new Set<number>();
      for (const col of data.collections) {
        const detailRes = await fetch(`/api/collections/${col.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const hasRecipe = detail.collection.recipes.some(
            (r: { recipeId: number }) => r.recipeId === recipeId
          );
          if (hasRecipe) ids.add(col.id);
        }
      }
      setMemberOf(ids);
    }
    setLoading(false);
  }

  async function toggleCollection(collectionId: number) {
    const isMember = memberOf.has(collectionId);
    const method = isMember ? "DELETE" : "POST";

    const res = await fetch(`/api/collections/${collectionId}/recipes`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    });

    if (res.ok) {
      setMemberOf((prev) => {
        const next = new Set(prev);
        if (isMember) {
          next.delete(collectionId);
        } else {
          next.add(collectionId);
        }
        return next;
      });
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      const col = data.collection;
      setCollections((prev) => [col, ...prev]);

      // Add recipe to the new collection
      await fetch(`/api/collections/${col.id}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      setMemberOf((prev) => new Set(prev).add(col.id));
      setNewName("");
    }
    setCreating(false);
  }

  function handleOpen() {
    if (!open) {
      fetchCollections();
    }
    setOpen(!open);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
      >
        <FolderPlus className="h-4 w-4" />
        Collection
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="p-3 border-b border-stone-100">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Add to collection
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto p-2">
            {loading ? (
              <p className="px-3 py-4 text-sm text-stone-400 text-center">
                Loading...
              </p>
            ) : collections.length === 0 ? (
              <p className="px-3 py-4 text-sm text-stone-400 text-center">
                No collections yet
              </p>
            ) : (
              collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      memberOf.has(col.id)
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-stone-300"
                    }`}
                  >
                    {memberOf.has(col.id) && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{col.name}</span>
                </button>
              ))
            )}
          </div>

          <form
            onSubmit={createAndAdd}
            className="border-t border-stone-100 p-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New collection..."
                className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newName.trim() || creating}
                className="rounded-lg bg-amber-600 p-1.5 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
