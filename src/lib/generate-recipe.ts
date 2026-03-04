import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface GeneratedRecipe {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: {
    name: string;
    quantity: string;
    unit: string | null;
    notes: string | null;
  }[];
  steps: {
    instruction: string;
    tipText: string | null;
  }[];
  dietaryTags: string[];
  categories: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
}

export async function generateRecipe(
  dishName: string
): Promise<GeneratedRecipe> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Write an original recipe for "${dishName}". Return ONLY valid JSON with this exact structure, no other text:

{
  "title": "Recipe Title",
  "description": "A 1-2 sentence appetising description of the dish.",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "Easy",
  "ingredients": [
    {"name": "ingredient name", "quantity": "2", "unit": "cups", "notes": "diced"}
  ],
  "steps": [
    {"instruction": "Step instruction here.", "tipText": "Optional helpful tip or null"}
  ],
  "dietaryTags": ["Vegan", "Gluten-Free"],
  "categories": ["Dinner"],
  "nutrition": {"calories": 450, "protein": 25.0, "carbs": 55.0, "fat": 12.0, "fiber": 6.0, "sugar": 8.0}
}

Rules:
- difficulty must be "Easy", "Medium", or "Hard"
- dietaryTags can include: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Nut-Free (only if truly applicable)
- categories can include: Breakfast, Lunch, Dinner, Desserts, Snacks, Sides, Baking, Drinks
- prepTime and cookTime in minutes
- Write genuinely original instructions in your own words
- Be specific with quantities and measurements
- Include 6-15 ingredients and 4-10 steps
- unit can be null for items counted whole (e.g. "2 eggs")
- notes can be null if no preparation notes needed
- nutrition: estimate calories (int, kcal), protein, carbs, fat, fiber, sugar (floats, grams) PER SERVING`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse recipe JSON for "${dishName}"`);
  }

  // Clean up common LLM JSON issues (trailing commas before ] or })
  const cleaned = jsonMatch[0]
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\x00-\x1F\x7F]/g, (ch) => (ch === "\n" || ch === "\r" || ch === "\t" ? ch : ""));

  let parsed: GeneratedRecipe;
  try {
    parsed = JSON.parse(cleaned) as GeneratedRecipe;
  } catch {
    // Retry once with a stricter prompt
    const retry = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `The following JSON is invalid. Fix it and return ONLY the corrected JSON, nothing else:\n\n${jsonMatch[0]}`,
        },
      ],
    });
    const retryText = retry.content[0].type === "text" ? retry.content[0].text : "";
    const retryMatch = retryText.match(/\{[\s\S]*\}/);
    if (!retryMatch) {
      throw new Error(`Failed to parse recipe JSON for "${dishName}" after retry`);
    }
    parsed = JSON.parse(retryMatch[0]) as GeneratedRecipe;
  }

  // Validate required fields
  if (!parsed.title || !parsed.ingredients?.length || !parsed.steps?.length) {
    throw new Error(`Invalid recipe data for "${dishName}"`);
  }

  return parsed;
}
