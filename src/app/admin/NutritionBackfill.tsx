"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Play, Square } from "lucide-react";

export function NutritionBackfill() {
  const [missing, setMissing] = useState(0);
  const [total, setTotal] = useState(0);
  const [batchSize, setBatchSize] = useState(10);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const stopRef = { current: false };

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/nutrition");
      const data = await res.json();
      setMissing(data.missing);
      setTotal(data.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const runBatch = async () => {
    setRunning(true);
    setProcessed(0);
    setErrors([]);
    stopRef.current = false;

    let remaining = missing;
    while (remaining > 0 && !stopRef.current) {
      try {
        const res = await fetch("/api/admin/nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: batchSize }),
        });
        const data = await res.json();
        setProcessed((p) => p + data.processed);
        if (data.errors?.length) {
          setErrors((prev) => [...prev, ...data.errors]);
        }
        remaining -= data.processed;
        if (data.processed === 0) break;
      } catch {
        break;
      }
    }

    setRunning(false);
    fetchCounts();
  };

  const stop = () => {
    stopRef.current = true;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 text-stone-400 mx-auto animate-spin" />
      </div>
    );
  }

  const estimated = total - missing;

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">
        Nutrition Estimation Backfill
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-stone-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-stone-800">{total}</p>
          <p className="text-sm text-stone-500">Total Recipes</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-700">{estimated}</p>
          <p className="text-sm text-stone-500">Estimated</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-amber-700">{missing}</p>
          <p className="text-sm text-stone-500">Missing</p>
        </div>
      </div>

      {missing > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-stone-600">
            Batch size:
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
              disabled={running}
              className="ml-2 rounded border border-stone-300 px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          {!running ? (
            <button
              type="button"
              onClick={runBatch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <Play className="h-4 w-4" />
              Start Backfill
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          )}
        </div>
      )}

      {running && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
            <span className="text-sm text-stone-600">
              Processed {processed} recipes...
            </span>
          </div>
          <div className="mt-2 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{
                width: `${missing > 0 ? (processed / missing) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {!running && processed > 0 && (
        <p className="text-sm text-green-600 mb-4">
          Completed! Estimated nutrition for {processed} recipes.
        </p>
      )}

      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-2">
            Errors ({errors.length}):
          </p>
          <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
