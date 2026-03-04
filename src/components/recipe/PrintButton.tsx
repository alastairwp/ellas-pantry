"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-amber-700 bg-stone-100 hover:bg-amber-50 rounded-lg transition-colors no-print"
      aria-label="Print recipe"
    >
      <Printer className="h-4 w-4" />
      <span>Print</span>
    </button>
  );
}
