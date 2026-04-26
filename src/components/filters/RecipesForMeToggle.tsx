"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import Link from "next/link";

export function RecipesForMeToggle() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const isActive = searchParams.get("forMe") === "true";

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/profile/allergies")
      .then((res) => res.json())
      .then((data) => setHasAllergies(data.allergies?.length > 0))
      .catch(() => setHasAllergies(false));
  }, [session?.user]);

  const handleToggle = useCallback(() => {
    if (!hasAllergies) {
      setShowPrompt(true);
      return;
    }

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
          isActive
            ? "bg-orange-100 text-orange-800 border-orange-300"
            : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
        }`}
        aria-pressed={isActive}
      >
        <Shield className="h-4 w-4" />
        Recipes for me
      </button>

      {showPrompt && !hasAllergies && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg border border-neutral-200 shadow-lg z-50 p-4">
          <p className="text-sm text-neutral-700 mb-3">
            You haven&apos;t set up your allergy profile yet. Set your allergies
            so we can filter recipes that are safe for you.
          </p>
          <div className="flex gap-2">
            <Link
              href="/profile/settings?tab=dietary"
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              Set up allergies
            </Link>
            <button
              type="button"
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
