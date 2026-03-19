interface NutritionPanelProps {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
}

function MacroRow({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-600">{label}</span>
      <span className="text-sm font-medium text-stone-800">
        {Math.round(value * 10) / 10}{unit}
      </span>
    </div>
  );
}

export function NutritionPanel({
  calories,
  protein,
  carbs,
  fat,
  fiber,
  sugar,
}: NutritionPanelProps) {
  if (calories == null) return null;

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden mb-6">
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
        <span className="font-medium text-stone-700">Estimated Nutritional Content</span>
        <span className="text-xs text-stone-400 ml-1">(per serving)</span>
      </div>

      <div className="p-4">
        {/* Calorie headline */}
        <div className="text-center pb-3 mb-3 border-b border-stone-200">
          <span className="text-3xl font-bold text-amber-700">{calories}</span>
          <span className="text-sm text-stone-500 ml-1">kcal</span>
        </div>

        {/* Macro rows */}
        <MacroRow label="Protein" value={protein} unit="g" />
        <MacroRow label="Carbs" value={carbs} unit="g" />
        <MacroRow label="Fat" value={fat} unit="g" />
        <MacroRow label="Fiber" value={fiber} unit="g" />
        <MacroRow label="Sugar" value={sugar} unit="g" />

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-stone-400 leading-relaxed text-center">
          Nutritional values are approximate and may vary depending on ingredient
          brands, sourcing, and where you purchase your produce.
        </p>
      </div>
    </div>
  );
}
