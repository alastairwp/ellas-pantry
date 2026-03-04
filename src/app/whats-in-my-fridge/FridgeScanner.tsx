"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Upload, Loader2, X, RefrigeratorIcon } from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { RecipeCardData } from "@/types/recipe";

type ScoredRecipe = RecipeCardData & {
  matchCount: number;
  totalIngredients: number;
  missingCount: number;
};

interface ScanResult {
  ingredients: string[];
  recipes: ScoredRecipe[];
}

type State = "idle" | "preview" | "scanning" | "results" | "error";

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function FridgeScanner() {
  const [state, setState] = useState<State>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await resizeImage(file, 1024);
    setImagePreview(dataUrl);
    setState("preview");
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleScan = useCallback(async () => {
    if (!imagePreview) return;
    setState("scanning");
    setError(null);

    try {
      const res = await fetch("/api/fridge-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }

      const data: ScanResult = await res.json();
      setResult(data);
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [imagePreview]);

  const reset = useCallback(() => {
    setState("idle");
    setImagePreview(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div>
      {/* Upload Area */}
      {(state === "idle" || state === "error") && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-stone-300 rounded-2xl p-12 text-center hover:border-amber-400 transition-colors"
        >
          <RefrigeratorIcon className="h-16 w-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-700 mb-2">
            Upload a photo of your fridge
          </h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Take a photo or upload an image of the inside of your fridge or
            freezer, and we&apos;ll suggest recipes you can make with what you
            have.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-700 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Preview */}
      {state === "preview" && imagePreview && (
        <div className="text-center">
          <div className="relative inline-block rounded-xl overflow-hidden shadow-lg mb-6">
            <Image
              src={imagePreview}
              alt="Fridge contents"
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
              onClick={handleScan}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Scan for Ingredients
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 text-stone-600 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
            >
              Choose Different Photo
            </button>
          </div>
        </div>
      )}

      {/* Scanning */}
      {state === "scanning" && (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 text-amber-600 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium text-stone-700">
            Scanning your fridge...
          </p>
          <p className="text-stone-500 mt-1">
            Our AI is identifying ingredients in your photo
          </p>
        </div>
      )}

      {/* Results */}
      {state === "results" && result && (
        <div>
          {/* Identified Ingredients */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 mb-3">
              Ingredients Found ({result.ingredients.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="px-3 py-1 bg-amber-50 text-amber-800 text-sm rounded-full border border-amber-200"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Recipe Results — grouped by missing ingredients */}
          {result.recipes.length > 0 ? (
            <>
              {(() => {
                const groups = new Map<number, ScoredRecipe[]>();
                for (const recipe of result.recipes) {
                  const list = groups.get(recipe.missingCount) || [];
                  list.push(recipe);
                  groups.set(recipe.missingCount, list);
                }
                const sortedKeys = [...groups.keys()].sort((a, b) => a - b);

                return sortedKeys.map((missing) => {
                  const recipes = groups.get(missing)!;
                  const label =
                    missing === 0
                      ? "Ready to make — you have everything!"
                      : missing === 1
                        ? "Just 1 ingredient missing"
                        : `${missing} ingredients missing`;
                  const badgeClass =
                    missing === 0
                      ? "bg-green-600"
                      : missing <= 2
                        ? "bg-amber-500"
                        : "bg-stone-400";

                  return (
                    <div key={missing} className="mb-8">
                      <h3 className="text-base font-semibold text-stone-700 mb-4">
                        {label}{" "}
                        <span className="text-sm font-normal text-stone-400">
                          ({recipes.length} recipe
                          {recipes.length !== 1 ? "s" : ""})
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recipes.map((recipe) => (
                          <div key={recipe.slug} className="relative">
                            <RecipeCard recipe={recipe} />
                            <div
                              className={`absolute top-3 left-3 px-2.5 py-1 ${badgeClass} text-white text-xs font-semibold rounded-full shadow-sm`}
                            >
                              {missing === 0
                                ? "All ingredients!"
                                : `Missing ${missing}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-stone-500">
                No matching recipes found for these ingredients.
              </p>
            </div>
          )}

          {/* Scan Again */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-700 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Scan Another Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
