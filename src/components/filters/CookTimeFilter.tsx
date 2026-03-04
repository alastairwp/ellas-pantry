"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const OPTIONS = [
  { label: "Under 15 min", value: 15 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 1 hour", value: 60 },
];

export function CookTimeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("maxCookTime") || "";

  const handleToggle = useCallback(
    (value: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (active === String(value)) {
        params.delete("maxCookTime");
      } else {
        params.set("maxCookTime", String(value));
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [active, router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Cook time filter">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleToggle(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
            active === String(opt.value)
              ? "bg-stone-800 text-white border-stone-800"
              : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
          }`}
          aria-pressed={active === String(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
