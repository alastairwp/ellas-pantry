"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Play, Square } from "lucide-react";

export function IntroductionBackfill() {
  const [missing, setMissing] = useState(0);
  const [total, setTotal] = useState(0);
  const [batchSize, setBatchSize] = useState(10);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [updated, setUpdated] = useState<{ title: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/introductions");
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
    setUpdated([]);
    const controller = new AbortController();
    abortRef.current = controller;

    let remaining = missing;
    while (remaining > 0 && !controller.signal.aborted) {
      try {
        const res = await fetch("/api/admin/introductions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: batchSize }),
          signal: controller.signal,
        });
        const data = await res.json();
        setProcessed((p) => p + data.processed);
        if (data.updated?.length) {
          setUpdated((prev) => [...prev, ...data.updated]);
        }
        if (data.errors?.length) {
          setErrors((prev) => [...prev, ...data.errors]);
        }
        remaining -= data.processed;
        if (data.processed === 0) break;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") break;
        break;
      }
    }

    abortRef.current = null;
    setRunning(false);
    fetchCounts();
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 text-neutral-400 mx-auto animate-spin" />
      </div>
    );
  }

  const generated = total - missing;

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-4">
        Introduction Backfill
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-neutral-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-neutral-800">{total}</p>
          <p className="text-sm text-neutral-500">AI Recipes</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-700">{generated}</p>
          <p className="text-sm text-neutral-500">Generated</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-orange-700">{missing}</p>
          <p className="text-sm text-neutral-500">Missing</p>
        </div>
      </div>

      {missing > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm text-neutral-600">
            Batch size:
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
              disabled={running}
              className="ml-2 rounded border border-neutral-300 px-2 py-1 text-sm"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
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
            <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
            <span className="text-sm text-neutral-600">
              Processed {processed} recipes...
            </span>
          </div>
          <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{
                width: `${missing > 0 ? (processed / missing) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {!running && processed > 0 && (
        <div className="mb-4">
          <p className="text-sm text-green-600 mb-2">
            Completed! Generated introductions for {processed} recipes.
          </p>
          {updated.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">
                Updated recipes ({updated.length}):
              </p>
              <ul className="text-xs text-green-700 space-y-1 max-h-40 overflow-y-auto">
                {updated.map((recipe, i) => (
                  <li key={i}>
                    <a
                      href={`/recipes/${recipe.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-900"
                    >
                      {recipe.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
