"use client";

import { useEffect, useState, useRef } from "react";
import { useSkillLevel } from "@/lib/skill-level";
import { CookingSteps } from "./CookingSteps";
import { SkillLevelSelector } from "./SkillLevelSelector";

interface Step {
  stepNumber: number;
  instruction: string;
  tipText?: string | null;
}

interface AdaptiveCookingStepsProps {
  originalSteps: Step[];
  recipeId: number;
  recipeTitle: string;
}

export function AdaptiveCookingSteps({
  originalSteps,
  recipeId,
}: AdaptiveCookingStepsProps) {
  const { skillLevel, adaptedSteps, setAdaptedSteps } = useSkillLevel();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (skillLevel === "intermediate") {
      setError(false);
      return;
    }

    // Already cached in context
    if (adaptedSteps[recipeId] && !error) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    fetch(`/api/recipes/${recipeId}/adapted-steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillLevel }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setAdaptedSteps(recipeId, data.steps);
          if (data.fallback) {
            setError(true);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillLevel, recipeId]);

  const displaySteps =
    skillLevel !== "intermediate" && adaptedSteps[recipeId]
      ? adaptedSteps[recipeId]
      : originalSteps;

  return (
    <div>
      <div className="mb-6">
        <SkillLevelSelector loading={loading} />
      </div>

      {loading ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-6">
            Instructions
          </h2>
          {originalSteps.map((step) => (
            <div key={step.stepNumber} className="flex gap-4 animate-pulse">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-200" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-stone-200 rounded w-full" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {error && (
            <p className="text-xs text-amber-600 mb-2">
              Couldn&apos;t adapt instructions — showing original steps.
            </p>
          )}
          <CookingSteps steps={displaySteps} />
        </>
      )}
    </div>
  );
}
