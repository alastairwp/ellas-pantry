"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Play,
  Square,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface GenerationJob {
  id: number;
  status: string;
  category: string;
  startOffset: number;
  currentOffset: number;
  targetCount: number;
  batchSize: number;
  concurrency: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

export function AIGenerator() {
  // Single generation
  const [singleDishName, setSingleDishName] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<{
    type: "success" | "error";
    text: string;
    slug?: string;
  } | null>(null);

  // Shared offset (persisted to DB via job processor)
  const [generatorOffset, setGeneratorOffset] = useState(0);
  const [offsetLoaded, setOffsetLoaded] = useState(false);

  // Batch settings
  const [batchSize, setBatchSize] = useState("10");
  const [concurrency, setConcurrency] = useState("3");
  const [targetCount, setTargetCount] = useState("100");
  const [category, setCategory] = useState("general");

  // Background job state
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Load offset when category changes
  useEffect(() => {
    const offsetKeys: Record<string, string> = {
      general: "generatorOffset",
      baking: "bakingGeneratorOffset",
      soups: "soupsGeneratorOffset",
      bread: "breadGeneratorOffset",
    };
    const key = offsetKeys[category] || "generatorOffset";
    setOffsetLoaded(false);
    fetch(`/api/admin/settings?key=${key}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch offset");
        return r.json();
      })
      .then((data) => {
        if (data.value != null) setGeneratorOffset(parseInt(data.value, 10));
        else setGeneratorOffset(0);
        setOffsetLoaded(true);
      })
      .catch(() => setOffsetLoaded(true));
  }, [category]);

  // Check for active job on mount
  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch jobs");
        return r.json();
      })
      .then((jobs: GenerationJob[]) => {
        const running = jobs.find(
          (j) => j.status === "running" || j.status === "stopping"
        );
        if (running) {
          setActiveJob(running);
          setGeneratorOffset(running.currentOffset);
          startPolling(running.id);
        }
      })
      .catch(() => {});
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollJobStatus = useCallback(async (jobId: number) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`);
      if (!res.ok) return; // skip this poll cycle
      const job: GenerationJob = await res.json();
      setActiveJob(job);
      setGeneratorOffset(job.currentOffset);

      if (job.status !== "running" && job.status !== "stopping") {
        stopPolling();
      }
    } catch {
      // Keep polling on transient errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling(jobId: number) {
    stopPolling();
    pollRef.current = setInterval(() => pollJobStatus(jobId), 3000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = undefined;
    }
  }

  async function saveOffset() {
    const offsetKeys: Record<string, string> = {
      general: "generatorOffset",
      baking: "bakingGeneratorOffset",
      soups: "soupsGeneratorOffset",
      bread: "breadGeneratorOffset",
    };
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: offsetKeys[category] || "generatorOffset", value: String(generatorOffset) }),
      });
      if (!res.ok) throw new Error("Failed to save offset");
    } catch {
      setJobError("Failed to save offset");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";

  // --- Single Recipe ---

  async function handleSingleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!singleDishName.trim()) return;

    setSingleLoading(true);
    setSingleResult(null);

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName: singleDishName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setSingleResult({
        type: "success",
        text: `"${data.recipe.title}" created successfully!`,
        slug: data.recipe.slug,
      });
      setSingleDishName("");
    } catch (err) {
      setSingleResult({
        type: "error",
        text: err instanceof Error ? err.message : "Generation failed",
      });
    } finally {
      setSingleLoading(false);
    }
  }

  // --- Background Job (batch + continuous) ---

  async function startJob(unlimited: boolean) {
    setJobError(null);

    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCount: unlimited ? 0 : parseInt(targetCount, 10) || 100,
          batchSize: parseInt(batchSize, 10) || 10,
          concurrency: parseInt(concurrency, 10) || 3,
          category,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = "Failed to start job";
        try {
          const data = JSON.parse(text);
          msg = data.error || msg;
        } catch { /* non-JSON error response */ }
        throw new Error(msg);
      }

      const job: GenerationJob = await res.json();
      setActiveJob(job);
      startPolling(job.id);
    } catch (err) {
      setJobError(err instanceof Error ? err.message : "Failed to start job");
    }
  }

  async function stopJob() {
    if (!activeJob) return;

    try {
      const res = await fetch(`/api/admin/jobs/${activeJob.id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to stop job");
      const job: GenerationJob = await res.json();
      setActiveJob(job);
      // Keep polling to show final status
      startPolling(job.id);
    } catch {
      setJobError("Failed to stop job");
    }
  }

  function clearJob() {
    setActiveJob(null);
    setJobError(null);
    stopPolling();
  }

  const isJobActive =
    activeJob?.status === "running" || activeJob?.status === "stopping";
  const isJobRunning = activeJob?.status === "running";
  const isJobStopping = activeJob?.status === "stopping";
  const isJobDone = activeJob && !isJobActive;
  const jobTotal = activeJob
    ? activeJob.successCount + activeJob.errorCount
    : 0;
  const jobTarget = activeJob?.targetCount || 0;

  return (
    <div className="space-y-10">
      {/* Single Recipe Generator */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-stone-800">
            Generate Single Recipe
          </h2>
        </div>
        <p className="text-sm text-stone-500 mb-4">
          Enter a dish name and AI will write an original recipe with
          ingredients, steps, and find a matching image.
        </p>

        <form onSubmit={handleSingleGenerate} className="flex gap-3">
          <input
            type="text"
            value={singleDishName}
            onChange={(e) => setSingleDishName(e.target.value)}
            placeholder="e.g. Thai Green Curry, Lemon Drizzle Cake..."
            className={`flex-1 ${inputClass}`}
            disabled={singleLoading}
          />
          <button
            type="submit"
            disabled={singleLoading || !singleDishName.trim()}
            className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {singleLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </form>

        {singleResult && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              singleResult.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {singleResult.text}
            {singleResult.slug && (
              <a
                href={`/recipes/${singleResult.slug}`}
                className="ml-2 underline"
                target="_blank"
              >
                View recipe
              </a>
            )}
          </div>
        )}
      </section>

      {/* Background Generator (batch + continuous) */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amber-700" />
          <h2 className="text-lg font-semibold text-stone-800">
            Background Generation
          </h2>
        </div>
        <p className="text-sm text-stone-600 mb-4">
          Generate recipes in the background from a pool of 700,000+ dish name
          combinations. Recipes keep generating even if you leave this page or
          close the tab. You can stop at any time.
        </p>

        {/* Settings (only show when no active job) */}
        {!isJobActive && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="general">General (700k+ dishes)</option>
                <option value="baking">Baking &amp; Desserts (22k+ names)</option>
                <option value="soups">Soups (500+ names)</option>
                <option value="bread">Bread (400+ names)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Target Count
                </label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  className={inputClass}
                  min="1"
                  max="10000"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  className={inputClass}
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Concurrency
                </label>
                <input
                  type="number"
                  value={concurrency}
                  onChange={(e) => setConcurrency(e.target.value)}
                  className={inputClass}
                  min="1"
                  max="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Current Offset
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={generatorOffset}
                    onChange={(e) =>
                      setGeneratorOffset(parseInt(e.target.value, 10) || 0)
                    }
                    className={inputClass}
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={saveOffset}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors whitespace-nowrap"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => startJob(false)}
                disabled={!offsetLoaded}
                className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                Generate {targetCount || 100} Recipes
              </button>
              <button
                onClick={() => startJob(true)}
                disabled={!offsetLoaded}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
              >
                <Play className="h-4 w-4" /> Run Continuously
              </button>
            </div>
          </>
        )}

        {/* Active job controls */}
        {isJobActive && (
          <div className="mb-4">
            <button
              onClick={stopJob}
              disabled={isJobStopping}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Square className="h-4 w-4" />{" "}
              {isJobStopping ? "Stopping..." : "Stop"}
            </button>
          </div>
        )}

        {/* Done state */}
        {isJobDone && (
          <div className="mb-4">
            <button
              onClick={clearJob}
              className="rounded-lg border border-amber-500 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
            >
              Start New Job
            </button>
          </div>
        )}

        {jobError && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {jobError}
          </div>
        )}

        {activeJob && (
          <div className="mt-4 space-y-3">
            {/* Status badge */}
            <div className="flex items-center gap-3">
              {isJobRunning && (
                <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating recipes in the background...
                </span>
              )}
              {isJobStopping && (
                <span className="inline-flex items-center gap-1.5 text-sm text-orange-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Stopping after current batch...
                </span>
              )}
              {activeJob.status === "completed" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </span>
              )}
              {activeJob.status === "failed" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  Failed
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="text-stone-600">
                Generated:{" "}
                <strong className="text-green-700">
                  {activeJob.successCount}
                </strong>
              </span>
              <span className="text-stone-600">
                Errors:{" "}
                <strong className="text-red-700">
                  {activeJob.errorCount}
                </strong>
              </span>
              <span className="text-stone-600">
                Offset: <strong>{activeJob.currentOffset}</strong>
              </span>
              {jobTarget > 0 && (
                <span className="text-stone-600">
                  Target: <strong>{jobTarget}</strong>
                </span>
              )}
              <span className="text-stone-400 text-xs">
                Started{" "}
                {new Date(activeJob.createdAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>
                  {jobTarget > 0
                    ? `Progress: ${jobTotal} / ${jobTarget}`
                    : `Total generated: ${jobTotal}`}
                </span>
                {jobTarget > 0 && (
                  <span>
                    {Math.min(
                      Math.round((jobTotal / jobTarget) * 100),
                      100
                    )}
                    %
                  </span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200">
                <div
                  className="h-2 rounded-full bg-amber-500 transition-all duration-300"
                  style={{
                    width:
                      jobTarget > 0
                        ? `${Math.min((jobTotal / jobTarget) * 100, 100)}%`
                        : `${Math.min((jobTotal / 1000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
