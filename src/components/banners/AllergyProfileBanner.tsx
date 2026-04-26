"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Shield } from "lucide-react";
import Link from "next/link";

const DISMISSED_KEY = "allergy-banner-dismissed";

export function AllergyProfileBanner() {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    fetch("/api/profile/allergies")
      .then((res) => res.json())
      .then((data) => {
        if (!data.allergies?.length) {
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [session?.user]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
      <Shield className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-neutral-700">
          <strong>Do you have food allergies?</strong> Set up your allergy
          profile to filter recipes and only see dishes that are safe for you.
        </p>
        <Link
          href="/profile/settings?tab=dietary"
          className="mt-2 inline-block text-sm font-medium text-orange-700 hover:text-orange-800 underline"
        >
          Set up my allergy profile
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-neutral-400 hover:text-neutral-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
