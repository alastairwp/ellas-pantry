"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Upload, Loader2, X, RefrigeratorIcon, Plus, Search, Trash2 } from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { RecipeCardData } from "@/types/recipe";
import { resizeImage } from "@/lib/image-utils";

type ScoredRecipe = RecipeCardData & {
  matchCount: number;
  totalIngredients: number;
  missingCount: number;
};

interface ScanResult {
  ingredients: string[];
  recipes: ScoredRecipe[];
}

interface ManualResult {
  recipes: ScoredRecipe[];
}

type Mode = "scan" | "manual";
type ScanState = "idle" | "preview" | "scanning" | "results" | "error";
type ManualState = "editing" | "searching" | "results" | "error";

export function FridgeScanner() {
  const [mode, setMode] = useState<Mode>("scan");

  // Scan state
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Manual state
  const [manualState, setManualState] = useState<ManualState>("editing");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Scan handlers ---

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await resizeImage(file, 1024);
    setImagePreview(dataUrl);
    setScanState("preview");
    setScanError(null);
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
    setScanState("scanning");
    setScanError(null);

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
      setScanResult(data);
      setScanState("results");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Something went wrong");
      setScanState("error");
    }
  }, [imagePreview]);

  const resetScan = useCallback(() => {
    setScanState("idle");
    setImagePreview(null);
    setScanResult(null);
    setScanError(null);
  }, []);

  // --- Manual handlers ---

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ingredients/suggest?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data: string[] = await res.json();
          setSearchResults(data);
        }
      } catch {
        // Silently fail search
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const addIngredient = useCallback((name: string) => {
    const lower = name.trim().toLowerCase();
    if (!lower) return;
    setSelectedIngredients((prev) => {
      if (prev.some((i) => i.toLowerCase() === lower)) return prev;
      return [...prev, lower];
    });
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const removeIngredient = useCallback((name: string) => {
    setSelectedIngredients((prev) => prev.filter((i) => i !== name));
  }, []);

  const handleManualSearch = useCallback(async () => {
    if (selectedIngredients.length === 0) return;
    setManualState("searching");
    setManualError(null);

    try {
      const res = await fetch("/api/fridge-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientNames: selectedIngredients }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Search failed");
      }

      const data: ManualResult = await res.json();
      setManualResult(data);
      setManualState("results");
    } catch (err) {
      setManualError(err instanceof Error ? err.message : "Something went wrong");
      setManualState("error");
    }
  }, [selectedIngredients]);

  const resetManual = useCallback(() => {
    setManualState("editing");
    setManualResult(null);
    setManualError(null);
  }, []);

  // --- Shared recipe results renderer ---

  const renderRecipes = (recipes: ScoredRecipe[]) => {
    if (recipes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-lg text-stone-500">
            No matching recipes found for these ingredients.
          </p>
        </div>
      );
    }

    const groups = new Map<number, ScoredRecipe[]>();
    for (const recipe of recipes) {
      const list = groups.get(recipe.missingCount) || [];
      list.push(recipe);
      groups.set(recipe.missingCount, list);
    }
    const sortedKeys = [...groups.keys()].sort((a, b) => a - b);

    return sortedKeys.map((missing) => {
      const groupRecipes = groups.get(missing)!;
      const label =
        missing === 0
          ? "Ready to make \u2014 you have everything!"
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
              ({groupRecipes.length} recipe
              {groupRecipes.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groupRecipes.map((recipe) => (
              <div key={recipe.slug} className="relative">
                <RecipeCard recipe={recipe} />
                <div
                  className={`absolute top-3 left-3 px-2.5 py-1 ${badgeClass} text-white text-xs font-semibold rounded-full shadow-sm`}
                >
                  {missing === 0 ? "All ingredients!" : `Missing ${missing}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-1 mb-8 bg-stone-100 rounded-lg p-1 max-w-md">
        <button
          type="button"
          onClick={() => setMode("scan")}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            mode === "scan"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Camera className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          Scan Photo
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Plus className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          Add Manually
        </button>
      </div>

      {/* ===== SCAN MODE ===== */}
      {mode === "scan" && (
        <>
          {/* Upload Area */}
          {(scanState === "idle" || scanState === "error") && (
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
                <label
                  htmlFor="fridge-scan-upload"
                  className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                  <input
                    id="fridge-scan-upload"
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
                  htmlFor="fridge-scan-camera"
                  className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-white text-stone-700 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                  <input
                    id="fridge-scan-camera"
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

              {scanError && (
                <p className="mt-4 text-sm text-red-600">{scanError}</p>
              )}
            </div>
          )}

          {/* Preview */}
          {scanState === "preview" && imagePreview && (
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
                  onClick={resetScan}
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
                  onClick={resetScan}
                  className="px-6 py-2.5 text-stone-600 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Choose Different Photo
                </button>
              </div>
            </div>
          )}

          {/* Scanning */}
          {scanState === "scanning" && (
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

          {/* Scan Results */}
          {scanState === "results" && scanResult && (
            <div>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-stone-800 mb-3">
                  Ingredients Found ({scanResult.ingredients.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {scanResult.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-3 py-1 bg-amber-50 text-amber-800 text-sm rounded-full border border-amber-200"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {renderRecipes(scanResult.recipes)}

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={resetScan}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-700 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Scan Another Photo
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== MANUAL MODE ===== */}
      {mode === "manual" && (
        <>
          {(manualState === "editing" || manualState === "error") && (
            <div>
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold text-stone-700 mb-2">
                  Add your ingredients
                </h2>
                <p className="text-stone-500 mb-6">
                  Search and add ingredients from your fridge, cupboard, larder, or
                  anywhere else. We&apos;ll find recipes you can make.
                </p>

                {/* Search input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        e.preventDefault();
                        addIngredient(searchQuery);
                      }
                    }}
                    placeholder="Type an ingredient and press Enter..."
                    className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 animate-spin" />
                  )}
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="mb-4 border border-stone-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                    {searchResults
                      .filter((r) => !selectedIngredients.some((s) => s.toLowerCase() === r.toLowerCase()))
                      .map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => addIngredient(name)}
                          className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-amber-50 transition-colors border-b border-stone-100 last:border-b-0"
                        >
                          <Plus className="h-3.5 w-3.5 inline-block mr-2 text-stone-400" />
                          {name}
                        </button>
                      ))}
                  </div>
                )}
                {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <p className="mb-4 text-sm text-stone-400">
                    No suggestions found — press Enter to add &ldquo;{searchQuery}&rdquo; anyway
                  </p>
                )}
              </div>

              {/* Selected ingredients */}
              {selectedIngredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-stone-600 mb-3">
                    Your ingredients ({selectedIngredients.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-sm rounded-full border border-amber-200"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeIngredient(name)}
                          className="text-amber-400 hover:text-amber-700 transition-colors"
                          aria-label={`Remove ${name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleManualSearch}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                    >
                      <Search className="h-4 w-4" />
                      Find Recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIngredients([])}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-stone-500 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {manualError && (
                <p className="mt-4 text-sm text-red-600">{manualError}</p>
              )}
            </div>
          )}

          {/* Searching */}
          {manualState === "searching" && (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 text-amber-600 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium text-stone-700">
                Finding recipes...
              </p>
              <p className="text-stone-500 mt-1">
                Matching your ingredients against our recipe collection
              </p>
            </div>
          )}

          {/* Manual Results */}
          {manualState === "results" && manualResult && (
            <div>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-stone-800 mb-3">
                  Your Ingredients ({selectedIngredients.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {selectedIngredients.map((name) => (
                    <span
                      key={name}
                      className="px-3 py-1 bg-amber-50 text-amber-800 text-sm rounded-full border border-amber-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {renderRecipes(manualResult.recipes)}

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={resetManual}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-700 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Edit Ingredients
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
