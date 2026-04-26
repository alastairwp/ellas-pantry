import { formatCurrency } from "@/lib/utils";

interface PriceIngredient {
  quantity: string;
  ingredient: {
    name: string;
    estimatedPrice: number | null;
    priceUnit: string | null;
  };
}

interface PriceEstimateProps {
  ingredients: PriceIngredient[];
}

export function PriceEstimate({ ingredients }: PriceEstimateProps) {
  const pricedIngredients = ingredients.filter(
    (item) => item.ingredient.estimatedPrice != null
  );

  if (pricedIngredients.length === 0) return null;

  const totalEstimate = pricedIngredients.reduce(
    (sum, item) => sum + (item.ingredient.estimatedPrice ?? 0),
    0
  );

  return (
    <details className="no-print border border-neutral-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-4 py-3 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors select-none">
        <span className="font-medium text-neutral-700">
          Estimated Cost
        </span>
        <span className="text-lg font-semibold text-orange-700">
          {formatCurrency(totalEstimate)}
        </span>
      </summary>

      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="pb-2 font-medium">Ingredient</th>
              <th className="pb-2 font-medium text-right">Est. Price</th>
            </tr>
          </thead>
          <tbody>
            {pricedIngredients.map((item, index) => (
              <tr
                key={index}
                className="border-b border-neutral-100 last:border-b-0"
              >
                <td className="py-2 text-neutral-700">
                  {item.ingredient.name}
                  {item.ingredient.priceUnit && (
                    <span className="text-neutral-400 text-xs ml-1">
                      ({item.ingredient.priceUnit})
                    </span>
                  )}
                </td>
                <td className="py-2 text-right text-neutral-600">
                  {formatCurrency(item.ingredient.estimatedPrice ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-xs text-neutral-400 italic">
          Prices are estimates based on average UK supermarket prices and may
          vary by location and retailer.
        </p>
      </div>
    </details>
  );
}
