"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { SlidersHorizontal, X, Shield, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

const DIETARY_OPTIONS = [
  { name: "Vegan", slug: "vegan" },
  { name: "Vegetarian", slug: "vegetarian" },
  { name: "Gluten-Free", slug: "gluten-free" },
  { name: "Dairy-Free", slug: "dairy-free" },
  { name: "Nut-Free", slug: "nut-free" },
  { name: "Egg-Free", slug: "egg-free" },
];

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

const COOK_TIME_OPTIONS = [
  { label: "Under 15 min", value: 15 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 1 hour", value: 60 },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Highest Rated", value: "rating" },
  { label: "Quickest", value: "quickest" },
];

const activeClasses: Record<string, string> = {
  vegan: "bg-green-100 text-green-800 border-green-300",
  vegetarian: "bg-emerald-100 text-emerald-800 border-emerald-300",
  "gluten-free": "bg-amber-100 text-amber-800 border-amber-300",
  "dairy-free": "bg-blue-100 text-blue-800 border-blue-300",
  "nut-free": "bg-purple-100 text-purple-800 border-purple-300",
  "egg-free": "bg-orange-100 text-orange-800 border-orange-300",
};

interface Category {
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: Category[];
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200 py-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-stone-800"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function RecipesForMeSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);

  const isActive = searchParams.get("forMe") === "true";

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/profile/allergies")
      .then((res) => res.json())
      .then((data) => setHasAllergies(data.allergies?.length > 0))
      .catch(() => setHasAllergies(false));
  }, [session?.user]);

  const handleToggle = useCallback(() => {
    if (!hasAllergies) return;
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.delete("forMe");
    } else {
      params.set("forMe", "true");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [hasAllergies, isActive, router, searchParams]);

  if (!session?.user) return null;
  if (hasAllergies === null) return null;

  if (!hasAllergies) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-stone-800">Recipes for me</span>
        </div>
        <p className="text-xs text-stone-600 mb-2">
          Set up your allergy profile to filter recipes that are safe for you.
        </p>
        <Link
          href="/profile/settings?tab=dietary"
          className="text-xs font-medium text-amber-700 hover:text-amber-800 underline"
        >
          Set up allergies
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex w-full items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
        isActive
          ? "bg-amber-100 text-amber-800 border-amber-300"
          : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
      }`}
      aria-pressed={isActive}
    >
      <Shield className="h-4 w-4" />
      Recipes for me
    </button>
  );
}

function SidebarContent({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeDietary = searchParams.get("dietary")?.split(",").filter(Boolean) ?? [];
  const activeCategory = searchParams.get("category") ?? "";
  const activeDifficulty = searchParams.get("difficulty") ?? "";
  const activeCookTime = searchParams.get("maxCookTime") ?? "";
  const activeSort = searchParams.get("sort") || "newest";
  const activeIngredient = searchParams.get("ingredient") || "";

  const [ingredientValue, setIngredientValue] = useState(activeIngredient);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setIngredientValue(searchParams.get("ingredient") || "");
  }, [searchParams]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleDietary = useCallback(
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
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [activeDietary, router, searchParams]
  );

  const handleIngredientChange = (text: string) => {
    setIngredientValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("ingredient", text.trim() || null), 400);
  };

  const activeCount =
    activeDietary.length +
    (activeCategory ? 1 : 0) +
    (activeDifficulty ? 1 : 0) +
    (activeCookTime ? 1 : 0) +
    (activeIngredient ? 1 : 0) +
    (searchParams.get("forMe") === "true" ? 1 : 0);

  const clearAll = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <span className="text-sm font-semibold text-stone-800 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Recipes for me */}
      <div className="py-4 border-b border-stone-200">
        <RecipesForMeSection />
      </div>

      {/* Ingredient search */}
      <FilterSection title="Ingredient">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={ingredientValue}
            onChange={(e) => handleIngredientChange(e.target.value)}
            placeholder="Search by ingredient..."
            className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-600 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Search by ingredient"
          />
          {ingredientValue && (
            <button
              type="button"
              onClick={() => handleIngredientChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600"
              aria-label="Clear ingredient search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* Dietary */}
      <FilterSection title="Dietary">
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => {
            const isActive = activeDietary.includes(option.slug);
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => toggleDietary(option.slug)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
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
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => updateParam("category", isActive ? null : cat.slug)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                  isActive
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
                }`}
                aria-pressed={isActive}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Difficulty */}
      <FilterSection title="Difficulty">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => updateParam("difficulty", activeDifficulty === opt ? null : opt)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                activeDifficulty === opt
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
              }`}
              aria-pressed={activeDifficulty === opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Cook time */}
      <FilterSection title="Cook Time">
        <div className="flex flex-wrap gap-2">
          {COOK_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                updateParam("maxCookTime", activeCookTime === String(opt.value) ? null : String(opt.value))
              }
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                activeCookTime === String(opt.value)
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
              }`}
              aria-pressed={activeCookTime === String(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort By">
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateParam("sort", opt.value === "newest" ? null : opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${
                activeSort === opt.value
                  ? "bg-amber-50 text-amber-800"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </>
  );
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchParams = useSearchParams();

  const activeCount =
    (searchParams.get("dietary")?.split(",").filter(Boolean).length ?? 0) +
    (searchParams.get("category") ? 1 : 0) +
    (searchParams.get("difficulty") ? 1 : 0) +
    (searchParams.get("maxCookTime") ? 1 : 0) +
    (searchParams.get("ingredient") ? 1 : 0) +
    (searchParams.get("forMe") === "true" ? 1 : 0);

  return (
    <>
      {/* Mobile: Filter button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: Slide-out drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <span className="text-base font-semibold text-stone-800">Filters</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 pb-4">
              <SidebarContent categories={categories} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <SidebarContent categories={categories} />
        </div>
      </aside>
    </>
  );
}
