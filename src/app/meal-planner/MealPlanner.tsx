"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  X,
  Plus,
  ShoppingCart,
  CalendarDays,
  Trash2,
  Search,
  Copy,
  Check,
  Printer,
  Bell,
  Send,
} from "lucide-react";
import { PushNotificationPrompt, PushNotificationToggle } from "@/components/pwa/PushNotificationPrompt";

interface RecipeSummary {
  id: number;
  slug: string;
  title: string;
  heroImage: string;
  prepTime: number;
  cookTime: number;
}

interface MealEntry {
  id: number;
  day: string;
  mealType: string;
  recipe: RecipeSummary;
}

interface MealPlan {
  id: number;
  meals: MealEntry[];
}

interface ShoppingItem {
  name: string;
  detail: string;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

type Tab = "plan" | "shopping";

export function MealPlanner() {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("plan");

  // Search modal state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDay, setSearchDay] = useState("");
  const [searchMealType, setSearchMealType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSummary[]>([]);
  const [searching, setSearching] = useState(false);

  // Shopping list state
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSent, setPushSent] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/meal-plan");
      const data = await res.json();
      setPlan(data.plan);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const openSearch = (day: string, mealType: string) => {
    setSearchDay(day);
    setSearchMealType(mealType);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(true);
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/recipes?query=${encodeURIComponent(query)}&limit=8`
      );
      const data = await res.json();
      setSearchResults(
        data.recipes?.map((r: RecipeSummary) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          heroImage: r.heroImage,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
        })) || []
      );
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }, []);

  const addEntry = async (recipeId: number) => {
    try {
      await fetch("/api/meal-plan/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          day: searchDay,
          mealType: searchMealType,
        }),
      });
      setSearchOpen(false);
      fetchPlan();
    } catch {
      // silently fail
    }
  };

  const removeEntry = async (entryId: number) => {
    try {
      await fetch(`/api/meal-plan/entries?id=${entryId}`, {
        method: "DELETE",
      });
      fetchPlan();
    } catch {
      // silently fail
    }
  };

  const clearPlan = async () => {
    try {
      await fetch("/api/meal-plan", { method: "PUT" });
      fetchPlan();
    } catch {
      // silently fail
    }
  };

  const fetchShoppingList = useCallback(async () => {
    setShoppingLoading(true);
    try {
      const res = await fetch("/api/meal-plan/shopping-list");
      const data = await res.json();
      setShoppingItems(data.items || []);
    } catch {
      // silently fail
    } finally {
      setShoppingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "shopping") {
      fetchShoppingList();
    }
  }, [tab, fetchShoppingList]);

  const toggleCheck = (name: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const copyShoppingList = () => {
    const text = shoppingItems
      .map((item) => `${item.name}${item.detail ? ` (${item.detail})` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendShoppingListPush = async () => {
    setSendingPush(true);
    try {
      const res = await fetch("/api/push/send-shopping-list", { method: "POST" });
      if (res.ok) {
        setPushSent(true);
        setTimeout(() => setPushSent(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSendingPush(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-8 w-8 text-amber-600 mx-auto animate-spin" />
      </div>
    );
  }

  const getEntriesForSlot = (day: string, mealType: string) =>
    plan?.meals.filter((m) => m.day === day && m.mealType === mealType) || [];

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => setTab("plan")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "plan"
              ? "bg-amber-600 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Weekly Plan
        </button>
        <button
          type="button"
          onClick={() => setTab("shopping")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "shopping"
              ? "bg-amber-600 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Shopping List
        </button>
        {tab === "plan" && plan && plan.meals.length > 0 && (
          <button
            type="button"
            onClick={clearPlan}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Plan Grid */}
      {tab === "plan" && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header row */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div /> {/* empty corner */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-stone-700 py-2"
                >
                  {DAY_LABELS[day]}
                </div>
              ))}
            </div>

            {/* Meal type rows */}
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                <div className="flex items-start justify-end pr-2 pt-2">
                  <span className="text-xs font-medium text-stone-500 capitalize">
                    {mealType}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const entries = getEntriesForSlot(day, mealType);
                  return (
                    <div
                      key={`${day}-${mealType}`}
                      className="min-h-[80px] border border-stone-200 rounded-lg p-1.5 bg-white"
                    >
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="group relative bg-amber-50 rounded-md p-1.5 mb-1 last:mb-0"
                        >
                          <Link
                            href={`/recipes/${entry.recipe.slug}`}
                            className="text-xs font-medium text-stone-700 hover:text-amber-700 line-clamp-2 block pr-4"
                          >
                            {entry.recipe.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="absolute top-1 right-1 p-0.5 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => openSearch(day, mealType)}
                        className="w-full flex items-center justify-center py-1 text-stone-300 hover:text-amber-500 transition-colors"
                        aria-label={`Add ${mealType} on ${day}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shopping List */}
      {tab === "shopping" && (
        <div>
          <PushNotificationPrompt />
          {shoppingLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 text-stone-400 mx-auto animate-spin" />
            </div>
          ) : shoppingItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">
                Add recipes to your meal plan to generate a shopping list.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={copyShoppingList}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy List"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={sendShoppingListPush}
                  disabled={sendingPush}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {pushSent ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {pushSent ? "Sent!" : sendingPush ? "Sending..." : "Send to Phone"}
                </button>
                <div className="ml-auto">
                  <PushNotificationToggle />
                </div>
              </div>
              <ul className="divide-y divide-stone-100">
                {shoppingItems.map((item) => (
                  <li key={item.name} className="flex items-center gap-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={checkedItems.has(item.name)}
                      onChange={() => toggleCheck(item.name)}
                      className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        checkedItems.has(item.name)
                          ? "line-through text-stone-400"
                          : "text-stone-700"
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.detail && (
                      <span className="text-xs text-stone-400">
                        {item.detail}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">
                Add Recipe —{" "}
                <span className="capitalize">
                  {DAY_LABELS[searchDay]} {searchMealType}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 hover:bg-stone-100 rounded-full"
              >
                <X className="h-5 w-5 text-stone-500" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {searching && (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 text-stone-400 mx-auto animate-spin" />
                </div>
              )}
              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-stone-500 py-6 text-sm">
                  No recipes found
                </p>
              )}
              {searchResults.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => addEntry(recipe.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 rounded-lg transition-colors text-left"
                >
                  {recipe.heroImage && (
                    <Image
                      src={recipe.heroImage}
                      alt=""
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {recipe.title}
                    </p>
                    <p className="text-xs text-stone-400">
                      {recipe.prepTime + recipe.cookTime} min total
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
