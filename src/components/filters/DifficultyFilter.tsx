"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const OPTIONS = ["Easy", "Medium", "Hard"];

export function DifficultyFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("difficulty") || "";

  const handleToggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (active === value) {
        params.delete("difficulty");
      } else {
        params.set("difficulty", value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [active, router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty filter">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => handleToggle(opt)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
            active === opt
              ? "bg-stone-800 text-white border-stone-800"
              : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
          }`}
          aria-pressed={active === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
