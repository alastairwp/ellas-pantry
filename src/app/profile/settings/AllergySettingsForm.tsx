"use client";

import { useState } from "react";
import {
  ALLERGY_TYPES,
  ALLERGY_LABELS,
  ALLERGY_DESCRIPTIONS,
  type AllergyType,
} from "@/lib/allergies";

interface AllergySettingsFormProps {
  initialAllergies: string[];
}

export function AllergySettingsForm({
  initialAllergies,
}: AllergySettingsFormProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialAllergies)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(allergy: AllergyType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(allergy)) {
        next.delete(allergy);
      } else {
        next.add(allergy);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allergies: Array.from(selected) }),
    });

    if (res.ok) {
      setMessage("Allergy preferences saved successfully.");
    } else {
      setMessage("Failed to save. Please try again.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-stone-600">
          Select any food allergies you have. We&apos;ll use this to filter
          recipes and show you only dishes that are safe for you.
        </p>
      </div>

      <div className="space-y-3">
        {ALLERGY_TYPES.map((allergy) => (
          <label
            key={allergy}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              selected.has(allergy)
                ? "border-amber-400 bg-amber-50"
                : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(allergy)}
              onChange={() => toggle(allergy)}
              className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-sm font-medium text-stone-800">
                {ALLERGY_LABELS[allergy]}
              </span>
              <p className="text-xs text-stone-500 mt-0.5">
                {ALLERGY_DESCRIPTIONS[allergy]}
              </p>
            </div>
          </label>
        ))}
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Allergies"}
      </button>
    </form>
  );
}
