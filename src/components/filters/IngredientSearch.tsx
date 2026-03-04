"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export function IngredientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("ingredient") || "";
  const [value, setValue] = useState(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setValue(searchParams.get("ingredient") || "");
  }, [searchParams]);

  const applyFilter = useCallback(
    (text: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (text.trim()) {
        params.set("ingredient", text.trim());
      } else {
        params.delete("ingredient");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleChange = (text: string) => {
    setValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyFilter(text), 400);
  };

  const clear = () => {
    setValue("");
    applyFilter("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by ingredient..."
        className="pl-8 pr-8 py-1.5 text-sm rounded-lg border border-stone-300 bg-white text-stone-600 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
        aria-label="Search by ingredient"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600"
          aria-label="Clear ingredient search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
