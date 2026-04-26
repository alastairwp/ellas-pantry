"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StarRating } from "./StarRating";
import Link from "next/link";

interface RecipeRatingProps {
  recipeId: number;
}

export function RecipeRating({ recipeId }: RecipeRatingProps) {
  const { data: session, status } = useSession();
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRating = useCallback(async () => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/rating`);
      const data = await res.json();
      setAverage(data.average);
      setCount(data.count);
      setUserRating(data.userRating);
    } catch {
      // Silently fail — ratings are non-critical
    }
  }, [recipeId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  async function handleRate(score: number) {
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "Failed to submit rating");
        return;
      }

      const data = await res.json();
      setAverage(data.average);
      setCount(data.count);
      setUserRating(data.userRating);
      setMessage(userRating ? "Rating updated" : "Thanks for rating!");
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Average rating display */}
      <div className="flex items-center gap-3">
        <StarRating
          rating={average}
          count={count}
          size="md"
        />
        {average > 0 && (
          <span className="text-sm font-medium text-neutral-700">
            {average.toFixed(1)}
          </span>
        )}
      </div>

      {/* User rating section */}
      {status === "loading" ? null : session ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">Your rating:</span>
          <StarRating
            rating={userRating || 0}
            interactive={!submitting}
            size="md"
            onRate={handleRate}
          />
          {message && (
            <span className="text-sm text-orange-600">{message}</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Sign in
          </Link>
          {" "}to rate this recipe
        </p>
      )}
    </div>
  );
}
