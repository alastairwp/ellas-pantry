"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderPlus, Trash2, BookOpen } from "lucide-react";

interface Collection {
  id: number;
  name: string;
  slug: string;
  _count: { recipes: number };
}

export function CollectionsList() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    const res = await fetch("/api/collections");
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections);
    }
    setLoading(false);
  }

  async function createCollection(e: React.FormEvent) {
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
      setCollections((prev) => [data.collection, ...prev]);
      setNewName("");
    }
    setCreating(false);
  }

  async function deleteCollection(id: number) {
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-stone-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Create form */}
      <form onSubmit={createCollection} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection name..."
          className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={!newName.trim() || creating}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          Create
        </button>
      </form>

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-stone-300" />
          <p className="mt-4 text-lg text-stone-500">No collections yet</p>
          <p className="mt-1 text-sm text-stone-400">
            Create your first collection to start organising recipes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group relative rounded-xl border border-stone-200 bg-white p-5 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <Link
                href={`/collections/${collection.id}`}
                className="block"
              >
                <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">
                  {collection.name}
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {collection._count.recipes} recipe
                  {collection._count.recipes !== 1 ? "s" : ""}
                </p>
              </Link>
              <button
                onClick={() => deleteCollection(collection.id)}
                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                aria-label={`Delete ${collection.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
