"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const DIETARY_OPTIONS = [
  { name: "Vegan", slug: "vegan" },
  { name: "Vegetarian", slug: "vegetarian" },
  { name: "Gluten-Free", slug: "gluten-free" },
  { name: "Dairy-Free", slug: "dairy-free" },
  { name: "Nut-Free", slug: "nut-free" },
];

const activeClasses: Record<string, string> = {
  vegan: "bg-green-100 text-green-800 border-green-300",
  vegetarian: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "gluten-free": "bg-amber-100 text-amber-800 border-amber-300",
  "dairy-free": "bg-blue-100 text-blue-800 border-blue-300",
  "nut-free": "bg-purple-100 text-purple-800 border-purple-300",
};

export function DietaryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeDietary = searchParams.get("dietary")?.split(",").filter(Boolean) ?? [];

  const handleToggle = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());

      let updated: string[];
      if (activeDietary.includes(slug)) {
        updated = activeDietary.filter((d) => d !== slug);
      } else {
        updated = [...activeDietary, slug];
      }

      if (updated.length > 0) {
        params.set("dietary", updated.join(","));
      } else {
        params.delete("dietary");
      }

      // Reset to page 1 on filter change
      params.delete("page");

      router.push(`?${params.toString()}`);
    },
    [activeDietary, router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Dietary filters">
      {DIETARY_OPTIONS.map((option) => {
        const isActive = activeDietary.includes(option.slug);

        return (
          <button
            key={option.slug}
            type="button"
            onClick={() => handleToggle(option.slug)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              isActive
                ? activeClasses[option.slug]
                : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
            }`}
            aria-pressed={isActive}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
