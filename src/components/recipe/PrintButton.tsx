"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-orange-700 bg-neutral-100 hover:bg-orange-50 rounded-lg transition-colors no-print"
      aria-label="Print recipe"
    >
      <Printer className="h-4 w-4" />
      <span>Print</span>
    </button>
  );
}
