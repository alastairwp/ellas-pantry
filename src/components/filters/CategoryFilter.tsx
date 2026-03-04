"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Category {
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";

  const handleSelect = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (activeCategory === slug) {
        // Deselect current category
        params.delete("category");
      } else {
        params.set("category", slug);
      }

      // Reset to page 1 on filter change
      params.delete("page");

      router.push(`?${params.toString()}`);
    },
    [activeCategory, router, searchParams]
  );

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
      role="group"
      aria-label="Category filters"
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.slug;

        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => handleSelect(category.slug)}
            className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full border transition-colors whitespace-nowrap ${
              isActive
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50 hover:border-stone-400"
            }`}
            aria-pressed={isActive}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
