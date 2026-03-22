"use client";

import { useSkillLevel, type SkillLevel } from "@/lib/skill-level";

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

interface SkillLevelSelectorProps {
  loading?: boolean;
}

export function SkillLevelSelector({ loading }: SkillLevelSelectorProps) {
  const { skillLevel, setSkillLevel } = useSkillLevel();

  return (
    <div>
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
        Detail level
      </p>
      <div className="flex gap-2">
        {LEVELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSkillLevel(value)}
            className={`relative px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              skillLevel === value
                ? "border-amber-400 bg-amber-50 text-amber-800"
                : "border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50"
            }`}
          >
            {label}
            {loading && skillLevel === value && value !== "intermediate" && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
