"use client";

import { Loader2, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import type { MissingSubstitutionsResult } from "@/lib/generate-missing-substitutions";

interface MissingSubstitutionsPanelProps {
  result: MissingSubstitutionsResult | null;
  loading: boolean;
  error: string | null;
}

const feasibilityStyles = {
  easy: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: CheckCircle,
    label: "Fully Feasible",
  },
  moderate: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: AlertTriangle,
    label: "Will Work With Changes",
  },
  difficult: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: AlertTriangle,
    label: "Consider Another Recipe",
  },
};

export function MissingSubstitutionsPanel({
  result,
  loading,
  error,
}: MissingSubstitutionsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-500 py-4 mt-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding substitutions...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 py-2 mt-4">{error}</p>;
  }

  if (!result) return null;

  const style = feasibilityStyles[result.feasibility.rating];
  const FeasibilityIcon = style.icon;

  return (
    <div className="mt-6 space-y-4">
      {/* Feasibility banner */}
      <div
        className={`flex items-start gap-2 rounded-lg ${style.bg} ${style.border} border p-3`}
      >
        <FeasibilityIcon
          className={`h-4 w-4 mt-0.5 shrink-0 ${style.text}`}
        />
        <div>
          <span className={`text-sm font-semibold ${style.text}`}>
            {style.label}
          </span>
          <p className={`text-sm ${style.text} mt-0.5`}>
            {result.feasibility.message}
          </p>
        </div>
      </div>

      {/* Substitution cards */}
      <div className="space-y-3">
        {result.substitutions.map((sub, i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-200 p-3"
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-stone-800 text-sm">
                {sub.missing}
              </span>
              <span className="text-xs text-stone-400">— {sub.role}</span>
            </div>

            {sub.canSubstitute && sub.options ? (
              <div className="space-y-2 mt-2">
                {sub.options.map((option, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-amber-700">
                        {option.name}
                      </span>
                      {option.quantity && (
                        <span className="text-stone-500 ml-1">
                          ({option.quantity})
                        </span>
                      )}
                      {option.notes && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {option.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-2 mt-2 rounded bg-red-50 p-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">
                  {sub.reason || "This ingredient is essential to the dish."}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
