"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Upload, Loader2, X, ChefHat } from "lucide-react";
import { resizeImage } from "@/lib/image-utils";
import type { GeneratedRecipe } from "@/lib/generate-recipe";

type State =
  | "idle"
  | "preview"
  | "scanning"
  | "draft"
  | "saving"
  | "error";

const DRAFT_STORAGE_KEY = "ellaspantry:dish-photo-draft";

export function DishPhotoCreator() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      const dataUrl = await resizeImage(file, 1024);
      setImagePreview(dataUrl);
      setState("preview");
      setError(null);
    } catch {
      setError("Could not read that file. Try another image.");
      setState("error");
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imagePreview) return;
    setState("scanning");
    setError(null);

    try {
      const res = await fetch("/api/user-recipes/from-dish-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not analyse the photo");
      }
      const data: { draft: GeneratedRecipe } = await res.json();
      setDraft(data.draft);
      setState("draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [imagePreview]);

  const handleSaveAndEdit = useCallback(async () => {
    if (!draft) return;
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/user-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: draft,
          visibility: "private",
          image: imagePreview,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not save the recipe");
      }
      const data: { id: number; slug: string } = await res.json();
      router.push(`/my-recipes/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [draft, imagePreview, router]);

  const reset = useCallback(() => {
    setState("idle");
    setImagePreview(null);
    setDraft(null);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
      {state === "idle" && (
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 mb-4">
            <ChefHat className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Photograph a finished dish
          </h2>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Snap a picture of a meal &mdash; restaurant, home cooked, anything.
            Our AI will identify it and draft a recipe for you to refine.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <label
              htmlFor="dish-photo-upload"
              className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
              <input
                id="dish-photo-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            <label
              htmlFor="dish-photo-camera"
              className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-white text-neutral-700 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Take Photo
              <input
                id="dish-photo-camera"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {state === "preview" && imagePreview && (
        <div className="text-center">
          <div className="relative inline-block rounded-xl overflow-hidden shadow-lg mb-6">
            <Image
              src={imagePreview}
              alt="Dish"
              width={500}
              height={400}
              className="max-h-[400px] w-auto object-contain"
            />
            <button
              type="button"
              onClick={reset}
              className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Identify Dish
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 text-neutral-600 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              Choose Different Photo
            </button>
          </div>
        </div>
      )}

      {state === "scanning" && (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium text-neutral-700">
            Looking at your dish...
          </p>
          <p className="text-neutral-500 mt-1">
            Identifying the dish and drafting a recipe
          </p>
        </div>
      )}

      {state === "saving" && (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium text-neutral-700">Saving your recipe...</p>
        </div>
      )}

      {state === "draft" && draft && (
        <div>
          <div className="mb-6">
            <p className="text-sm font-medium text-orange-700 uppercase tracking-wide">
              Identified
            </p>
            <h2 className="text-2xl font-semibold text-neutral-900 mt-1">
              {draft.title}
            </h2>
            <p className="text-neutral-600 mt-2">{draft.description}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div>
              <h3 className="font-semibold text-neutral-800 mb-3">
                Ingredients ({draft.ingredients.length})
              </h3>
              <ul className="space-y-1.5 text-sm text-neutral-700">
                {draft.ingredients.map((ing, i) => (
                  <li key={i}>
                    <span className="font-medium">
                      {ing.quantity}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </span>{" "}
                    {ing.name}
                    {ing.notes ? `, ${ing.notes}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800 mb-3">
                Method ({draft.steps.length} steps)
              </h3>
              <ol className="space-y-2 text-sm text-neutral-700 list-decimal pl-5">
                {draft.steps.map((step, i) => (
                  <li key={i}>{step.instruction}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-sm text-orange-900">
            This is a starting point. On the next screen you can edit anything,
            add hidden ingredients the camera couldn&apos;t see, and tweak the
            steps before saving to your private collection.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveAndEdit}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Save &amp; Edit
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 text-neutral-600 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              Try Another Photo
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-2.5 text-neutral-600 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
