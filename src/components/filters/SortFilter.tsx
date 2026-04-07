"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const OPTIONS = [
  { label: "Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Highest Rated", value: "rating" },
  { label: "Quickest", value: "quickest" },
];

export function SortFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("sort") || "popular";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "popular") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <select
      value={active}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-300 bg-white text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      aria-label="Sort recipes"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
