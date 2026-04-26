"use client";

import { useState, useEffect, useRef } from "react";
import { HelpCircle, Loader2, CheckCircle, Lightbulb, ChevronDown } from "lucide-react";
import type { TroubleshootingResult } from "@/lib/generate-troubleshooting";

interface TroubleshooterPanelProps {
  recipeId: number;
}

const COMMON_PROBLEMS = [
  "Didn't rise",
  "Too salty",
  "Burnt outside",
  "Raw inside",
  "Texture wrong",
  "Flavour off",
];

const likelihoodStyles = {
  high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  medium: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  low: { bg: "bg-neutral-50", border: "border-neutral-200", badge: "bg-neutral-100 text-neutral-600" },
};

export function TroubleshooterPanel({ recipeId }: TroubleshooterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TroubleshootingResult | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-expand when URL hash is #troubleshooter
  useEffect(() => {
    if (window.location.hash === "#troubleshooter") {
      setExpanded(true);
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }

    function onHashChange() {
      if (window.location.hash === "#troubleshooter") {
        setExpanded(true);
        setTimeout(() => {
          panelRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  async function diagnose() {
    const trimmed = problem.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/troubleshoot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemDescription: trimmed }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data: TroubleshootingResult = await res.json();
      setResult(data);
    } catch {
      setError("Could not generate diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setProblem("");
    setResult(null);
    setError(null);
  }

  return (
    <div ref={panelRef} id="troubleshooter" className="mt-10">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <HelpCircle className="h-5 w-5 text-orange-600" />
        <h2 className="text-xl font-semibold text-neutral-800">
          What Went Wrong?
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 ml-auto transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {!result && (
            <>
              <p className="text-sm text-neutral-500">
                Describe what went wrong and get AI-powered troubleshooting advice.
              </p>

              {/* Common problem pills */}
              <div className="flex flex-wrap gap-2">
                {COMMON_PROBLEMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProblem(p)}
                    disabled={loading}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                      problem === p
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-neutral-300 text-neutral-600 hover:border-orange-400 hover:text-orange-700"
                    } disabled:opacity-50`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  maxLength={500}
                  disabled={loading}
                  placeholder="e.g. My cake sank in the middle, the edges are dry but the centre is gooey..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50 resize-none"
                  rows={3}
                />
                <p className="text-xs text-neutral-400 mt-1 text-right">
                  {problem.length}/500
                </p>
              </div>

              {/* Diagnose button */}
              <button
                type="button"
                onClick={diagnose}
                disabled={loading || problem.trim().length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Diagnosing...
                  </>
                ) : (
                  "Diagnose"
                )}
              </button>
            </>
          )}

          {/* Error */}
          {error && !loading && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Diagnosis banner */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-blue-800">
                    Diagnosis
                  </span>
                  <p className="text-sm text-blue-800 mt-0.5">
                    {result.diagnosis}
                  </p>
                </div>
              </div>

              {/* Likely causes */}
              {result.causes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">
                    Likely Causes
                  </h3>
                  <div className="space-y-2">
                    {result.causes.map((cause, i) => {
                      const style = likelihoodStyles[cause.likelihood];
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border ${style.border} ${style.bg} p-3`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}
                            >
                              {cause.likelihood}
                            </span>
                            {cause.relatedStep && (
                              <span className="text-xs text-neutral-400">
                                Step {cause.relatedStep}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-700">
                            {cause.cause}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fixes */}
              {result.fixes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">
                    Next Time
                  </h3>
                  <div className="space-y-1.5">
                    {result.fixes.map((fix, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-2.5"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-green-800">{fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salvage tip */}
              {result.salvage && (
                <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3">
                  <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-orange-800">
                      Salvage Tip
                    </span>
                    <p className="text-sm text-orange-800 mt-0.5">
                      {result.salvage}
                    </p>
                  </div>
                </div>
              )}

              {/* Reset button */}
              <button
                type="button"
                onClick={reset}
                className="text-sm text-neutral-500 hover:text-orange-600 underline transition-colors"
              >
                Try another problem
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
