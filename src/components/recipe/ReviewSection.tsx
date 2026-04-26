"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface Review {
  id: number;
  text: string;
  createdAt: string;
  userId?: string;
  user: { id: string; name: string | null; image: string | null };
}

interface ReviewSectionProps {
  recipeId: number;
}

export function ReviewSection({ recipeId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(
    async (p: number, append = false) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/recipes/${recipeId}/reviews?page=${p}`
        );
        const data = await res.json();
        setReviews((prev) =>
          append ? [...prev, ...data.reviews] : data.reviews
        );
        setTotal(data.total);

        // Find current user's review
        if (session?.user?.id && !append) {
          const existing = data.reviews.find(
            (r: Review & { userId?: string }) =>
              r.userId === session.user?.id
          );
          if (existing) {
            setUserReview(existing);
            setText(existing.text);
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [recipeId, session?.user?.id]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserReview(data.review);
        // Refresh reviews list
        fetchReviews(1);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const hasMore = reviews.length < total;

  return (
    <div className="mt-10 no-print">
      <h2 className="text-xl font-semibold text-neutral-800 mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Reviews
        {total > 0 && (
          <span className="text-sm font-normal text-neutral-400">({total})</span>
        )}
      </h2>

      {/* Write Review Form */}
      {session?.user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {userReview ? "Update your review" : "Write a review"}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Share your experience with this recipe..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-700 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {text.length}/2000
            </span>
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {userReview ? "Update Review" : "Submit Review"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-8 text-sm text-neutral-500">
          <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Sign in
          </a>{" "}
          to write a review.
        </p>
      )}

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 text-neutral-400 mx-auto animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">
          No reviews yet. Be the first to review this recipe!
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-neutral-100 pb-5 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <Link href={`/profile/${review.user.id}`}>
                  <Avatar name={review.user.name} image={review.user.image} size="sm" />
                </Link>
                <div>
                  <Link
                    href={`/profile/${review.user.id}`}
                    className="text-sm font-medium text-neutral-800 hover:text-orange-700 transition-colors"
                  >
                    {review.user.name || "Anonymous"}
                  </Link>
                  <p className="text-xs text-neutral-400">
                    {new Date(review.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed">{review.text}</p>
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchReviews(nextPage, true);
              }}
              disabled={loading}
              className="w-full py-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              {loading ? "Loading..." : "Load more reviews"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
