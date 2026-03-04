import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string | null;
}

export async function estimateNutrition(
  ingredients: IngredientInput[],
  servings: number
): Promise<NutritionEstimate> {
  const ingredientList = ingredients
    .map((i) => `${i.quantity}${i.unit ? ` ${i.unit}` : ""} ${i.name}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Estimate the nutrition PER SERVING for a recipe that serves ${servings} people with these ingredients:

${ingredientList}

Return ONLY valid JSON with this exact structure, no other text:
{
  "calories": 450,
  "protein": 25.0,
  "carbs": 55.0,
  "fat": 12.0,
  "fiber": 6.0,
  "sugar": 8.0
}

Rules:
- calories is an integer in kcal
- protein, carbs, fat, fiber, sugar are floats in grams
- All values are PER SINGLE SERVING (total divided by ${servings})
- Round to 1 decimal place for grams`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse nutrition JSON");
  }

  const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(cleaned) as NutritionEstimate;

  if (typeof parsed.calories !== "number" || typeof parsed.protein !== "number") {
    throw new Error("Invalid nutrition data");
  }

  return parsed;
}
