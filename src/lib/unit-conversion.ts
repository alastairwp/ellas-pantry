export type UnitSystem = "metric" | "imperial";

interface ConversionResult {
  quantity: string;
  unit: string | null;
}

const METRIC_TO_IMPERIAL: Record<string, { unit: string; factor: number }> = {
  g: { unit: "oz", factor: 0.03527396 },
  kg: { unit: "lb", factor: 2.20462 },
  ml: { unit: "fl oz", factor: 0.033814 },
  l: { unit: "cups", factor: 4.22675 },
  cm: { unit: "in", factor: 0.393701 },
};

const IMPERIAL_TO_METRIC: Record<string, { unit: string; factor: number }> = {
  oz: { unit: "g", factor: 28.3495 },
  lb: { unit: "kg", factor: 0.453592 },
  lbs: { unit: "kg", factor: 0.453592 },
  "fl oz": { unit: "ml", factor: 29.5735 },
  cups: { unit: "ml", factor: 236.588 },
  cup: { unit: "ml", factor: 236.588 },
  in: { unit: "cm", factor: 2.54 },
  inches: { unit: "cm", factor: 2.54 },
  inch: { unit: "cm", factor: 2.54 },
};

export function convertUnit(
  quantity: string,
  unit: string | null,
  target: UnitSystem
): ConversionResult {
  if (!unit) return { quantity, unit };

  const normalised = unit.toLowerCase().trim();
  const num = parseFloat(quantity);
  if (isNaN(num)) return { quantity, unit };

  const map =
    target === "imperial" ? METRIC_TO_IMPERIAL : IMPERIAL_TO_METRIC;
  const conv = map[normalised];
  if (!conv) return { quantity, unit };

  const converted = num * conv.factor;
  return {
    quantity: String(Math.round(converted * 100) / 100),
    unit: conv.unit,
  };
}
