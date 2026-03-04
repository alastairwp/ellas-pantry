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
        <span className="font-medium text-stone-700">Estimated Nutrition</span>
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
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Estimates only.</span> These
            nutrition values are AI-generated approximations and have not been
            verified by a nutritionist. Actual values may vary based on specific
            ingredients, brands, and preparation methods. Do not use for medical
            dietary planning.
          </p>
        </div>
      </div>
    </div>
  );
}
