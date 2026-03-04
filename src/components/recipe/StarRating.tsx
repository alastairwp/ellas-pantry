"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onRate?: (score: number) => void;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  count,
  interactive = false,
  size = "md",
  onRate,
}: StarRatingProps) {
  const [hoverScore, setHoverScore] = useState(0);
  const displayRating = hoverScore || rating;
  const iconSize = sizeMap[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className="inline-flex items-center gap-0.5"
        onMouseLeave={() => interactive && setHoverScore(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayRating >= star;
          const half = !filled && displayRating >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(star)}
              onMouseEnter={() => interactive && setHoverScore(star)}
              className={`${
                interactive
                  ? "cursor-pointer hover:scale-110 transition-transform"
                  : "cursor-default"
              } disabled:cursor-default`}
            >
              <Star
                className={`${iconSize} transition-colors ${
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : half
                      ? "fill-amber-200 text-amber-400"
                      : "fill-none text-stone-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span className={`text-stone-500 ${size === "sm" ? "text-xs" : "text-sm"}`}>
          ({count})
        </span>
      )}
    </div>
  );
}
