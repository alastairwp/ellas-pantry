"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function ViewToggle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">(() => {
    const param = searchParams.get("view");
    if (param === "list") return "list";
    if (typeof window !== "undefined") {
      return (localStorage.getItem("recipe-view-mode") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  useEffect(() => {
    localStorage.setItem("recipe-view-mode", view);
  }, [view]);

  const toggle = useCallback(
    (mode: "grid" | "list") => {
      setView(mode);
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "list") {
        params.set("view", "list");
      } else {
        params.delete("view");
      }
      router.replace(`/recipes?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  return (
    <div className="flex items-center rounded-lg border border-neutral-200 overflow-hidden">
      <button
        onClick={() => toggle("grid")}
        className={`p-2 transition-colors ${
          view === "grid"
            ? "bg-neutral-800 text-white"
            : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
        }`}
        title="Gallery view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => toggle("list")}
        className={`p-2 transition-colors ${
          view === "list"
            ? "bg-neutral-800 text-white"
            : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
        }`}
        title="List view"
      >
        <LayoutList className="h-4 w-4" />
      </button>
    </div>
  );
}
