"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

interface AdaptedStep {
  stepNumber: number;
  instruction: string;
  tipText: string | null;
}

interface SkillLevelContextValue {
  skillLevel: SkillLevel;
  setSkillLevel: (level: SkillLevel) => void;
  adaptedSteps: Record<string, AdaptedStep[]>;
  setAdaptedSteps: (recipeId: number, level: SkillLevel, steps: AdaptedStep[]) => void;
}

const SkillLevelContext = createContext<SkillLevelContextValue | null>(null);

const STORAGE_KEY = "ellas-pantry-skill-level";

interface SkillLevelProviderProps {
  children: ReactNode;
  initialSkillLevel?: SkillLevel;
  isLoggedIn?: boolean;
}

export function SkillLevelProvider({
  children,
  initialSkillLevel,
  isLoggedIn,
}: SkillLevelProviderProps) {
  const [skillLevel, setSkillLevelState] = useState<SkillLevel>(() => {
    if (initialSkillLevel) return initialSkillLevel;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["beginner", "intermediate", "advanced"].includes(stored)) {
        return stored as SkillLevel;
      }
    }
    return "intermediate";
  });

  const [adaptedSteps, setAdaptedStepsMap] = useState<
    Record<string, AdaptedStep[]>
  >({});

  // Hydrate from localStorage on mount (for SSR mismatch prevention)
  useEffect(() => {
    if (!initialSkillLevel) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (
        stored &&
        ["beginner", "intermediate", "advanced"].includes(stored) &&
        stored !== skillLevel
      ) {
        setSkillLevelState(stored as SkillLevel);
      }
    }
  }, [initialSkillLevel, skillLevel]);

  const setSkillLevel = useCallback(
    (level: SkillLevel) => {
      setSkillLevelState(level);
      localStorage.setItem(STORAGE_KEY, level);

      if (isLoggedIn) {
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillLevel: level }),
        }).catch(() => {
          // Silently fail — localStorage is the source of truth for this session
        });
      }
    },
    [isLoggedIn]
  );

  const setAdaptedSteps = useCallback(
    (recipeId: number, level: SkillLevel, steps: AdaptedStep[]) => {
      setAdaptedStepsMap((prev) => ({ ...prev, [`${recipeId}:${level}`]: steps }));
    },
    []
  );

  return (
    <SkillLevelContext.Provider
      value={{ skillLevel, setSkillLevel, adaptedSteps, setAdaptedSteps }}
    >
      {children}
    </SkillLevelContext.Provider>
  );
}

export function useSkillLevel() {
  const ctx = useContext(SkillLevelContext);
  if (!ctx) {
    throw new Error("useSkillLevel must be used within a SkillLevelProvider");
  }
  return ctx;
}
