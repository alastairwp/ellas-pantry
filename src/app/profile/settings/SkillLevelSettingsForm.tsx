"use client";

import { useState } from "react";
import { useSkillLevel, type SkillLevel } from "@/lib/skill-level";

const SKILL_OPTIONS: {
  value: SkillLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    description:
      "I'm learning to cook. Show detailed instructions with technique tips.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "I'm comfortable cooking. Show standard instructions.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "I'm experienced. Show concise, professional instructions.",
  },
];

interface SkillLevelSettingsFormProps {
  initialSkillLevel: SkillLevel;
}

export function SkillLevelSettingsForm({
  initialSkillLevel,
}: SkillLevelSettingsFormProps) {
  const { setSkillLevel: setContextLevel } = useSkillLevel();
  const [selected, setSelected] = useState<SkillLevel>(initialSkillLevel);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillLevel: selected }),
    });

    if (res.ok) {
      setContextLevel(selected);
      setMessage("Cooking skill level saved successfully.");
    } else {
      setMessage("Failed to save. Please try again.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-stone-600">
          Choose your cooking skill level. This controls how much detail recipe
          instructions show — beginners get expanded tips, advanced cooks get
          concise professional steps.
        </p>
      </div>

      <div className="space-y-3">
        {SKILL_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              selected === option.value
                ? "border-amber-400 bg-amber-50"
                : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            <input
              type="radio"
              name="skillLevel"
              value={option.value}
              checked={selected === option.value}
              onChange={() => setSelected(option.value)}
              className="mt-0.5 h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-sm font-medium text-stone-800">
                {option.label}
              </span>
              <p className="text-xs text-stone-500 mt-0.5">
                {option.description}
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
        {saving ? "Saving..." : "Save Skill Level"}
      </button>
    </form>
  );
}
