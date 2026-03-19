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

/**
 * Round to the nearest "friendly" cooking value.
 * Small values → nearest quarter, medium → nearest half, large → nearest whole.
 */
function friendlyRound(value: number): number {
  if (value < 0.125) return Math.round(value * 10) / 10;
  if (value < 3) return Math.round(value * 4) / 4;     // nearest ¼
  if (value < 10) return Math.round(value * 2) / 2;    // nearest ½
  return Math.round(value);                              // nearest whole
}

/**
 * After converting, step to a more natural imperial unit when the number
 * is awkwardly large (e.g. 25 fl oz → ~3 cups, 20 oz → ~1¼ lb).
 */
function stepImperialUnit(value: number, unit: string): { value: number; unit: string } {
  if (unit === "fl oz" && value >= 8) {
    return { value: value / 8, unit: "cups" };
  }
  if (unit === "oz" && value >= 16) {
    return { value: value / 16, unit: "lb" };
  }
  return { value, unit };
}

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

  let converted = num * conv.factor;
  let resultUnit = conv.unit;

  // For imperial output, step to friendlier units when values are large
  if (target === "imperial") {
    const stepped = stepImperialUnit(converted, resultUnit);
    converted = stepped.value;
    resultUnit = stepped.unit;
  }

  const rounded = friendlyRound(converted);

  return {
    quantity: String(rounded),
    unit: resultUnit,
  };
}
