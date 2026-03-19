"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import {
  ALLERGY_TYPES,
  ALLERGY_LABELS,
  type AllergyType,
} from "@/lib/allergies";
import {
  EGG_KEYWORDS,
  DAIRY_KEYWORDS,
  NUT_KEYWORDS,
  GLUTEN_KEYWORDS,
} from "@/lib/dietary-validation";

const ALLERGY_KEYWORD_MAP: Record<AllergyType, string[]> = {
  eggs: EGG_KEYWORDS,
  dairy: DAIRY_KEYWORDS,
  nuts: NUT_KEYWORDS,
  gluten: GLUTEN_KEYWORDS,
};

function ingredientMatchesAllergy(
  ingredientName: string,
  allergy: AllergyType
): boolean {
  const lower = ingredientName.toLowerCase();
  const keywords = ALLERGY_KEYWORD_MAP[allergy];
  if (allergy === "eggs") {
    return keywords.some((k) => new RegExp(`\\b${k}s?\\b`).test(lower));
  }
  return keywords.some((k) => lower.includes(k));
}

interface AllergenWarningProps {
  ingredientNames: string[];
}

export function AllergenWarning({ ingredientNames }: AllergenWarningProps) {
  const { data: session } = useSession();
  const [matchedAllergies, setMatchedAllergies] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/profile/allergies")
      .then((res) => res.json())
      .then((data) => {
        if (!data.allergies?.length) return;

        const matches: string[] = [];
        for (const allergy of data.allergies as AllergyType[]) {
          if (!ALLERGY_TYPES.includes(allergy)) continue;
          const hasAllergen = ingredientNames.some((name) =>
            ingredientMatchesAllergy(name, allergy)
          );
          if (hasAllergen) {
            matches.push(ALLERGY_LABELS[allergy]);
          }
        }
        setMatchedAllergies(matches);
      })
      .catch(() => {});
  }, [session?.user, ingredientNames]);

  if (matchedAllergies.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-red-800">Allergen warning</p>
        <p className="text-sm text-red-700 mt-0.5">
          This recipe contains ingredients you may be allergic to:{" "}
          <strong>{matchedAllergies.join(", ")}</strong>
        </p>
      </div>
    </div>
  );
}
