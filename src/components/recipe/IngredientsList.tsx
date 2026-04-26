import { CopyIngredientsButton } from "./CopyIngredientsButton";
import { toFraction } from "@/lib/utils";

interface IngredientItem {
  quantity: string;
  unit: string | null;
  notes: string | null;
  ingredient: {
    name: string;
  };
}

interface IngredientsListProps {
  ingredients: IngredientItem[];
}

export function IngredientsList({ ingredients }: IngredientsListProps) {
  return (
    <div className="print-ingredients">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-neutral-800">Ingredients</h2>
        <CopyIngredientsButton ingredients={ingredients} />
      </div>

      <ul className="space-y-2">
        {ingredients.map((item, index) => (
          <li
            key={index}
            className="flex items-baseline gap-1 py-1.5 border-b border-neutral-100 last:border-b-0 text-neutral-700"
          >
            <span className="font-medium">
              {toFraction(item.quantity)}
              {item.unit ? ` ${item.unit}` : ""}
            </span>
            <span>{item.ingredient.name}</span>
            {item.notes && (
              <span className="text-sm text-neutral-400">({item.notes})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
