export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours} hr${hours > 1 ? "s" : ""} ${mins} mins`;
}

export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

const fractionMap: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [0.333, "⅓"],
  [0.5, "½"],
  [0.667, "⅔"],
  [0.75, "¾"],
];

/**
 * Convert a decimal quantity string to use vulgar fractions.
 * e.g. "0.5" → "½", "1.25" → "1¼", "2" → "2"
 */
export function toFraction(quantity: string): string {
  const num = parseFloat(quantity);
  if (isNaN(num)) return quantity;

  const whole = Math.floor(num);
  const decimal = num - whole;

  if (decimal < 0.05) {
    return whole === 0 ? quantity : String(whole);
  }

  for (const [threshold, symbol] of fractionMap) {
    if (Math.abs(decimal - threshold) < 0.05) {
      return whole > 0 ? `${whole}${symbol}` : symbol;
    }
  }

  return quantity;
}
