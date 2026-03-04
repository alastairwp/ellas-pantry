"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarDays, X, Loader2 } from "lucide-react";

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

interface AddToMealPlanProps {
  recipeId: number;
}

export function AddToMealPlan({ recipeId }: AddToMealPlanProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("monday");
  const [mealType, setMealType] = useState("dinner");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!session?.user) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/meal-plan/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, day, mealType }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1500);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
      >
        <CalendarDays className="h-4 w-4" />
        Add to Meal Plan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">
                Add to Meal Plan
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-stone-100 rounded-full"
              >
                <X className="h-5 w-5 text-stone-500" />
              </button>
            </div>

            {success ? (
              <p className="text-center py-6 text-green-600 font-medium">
                Added to your meal plan!
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Day
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Meal
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Add to Plan
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
