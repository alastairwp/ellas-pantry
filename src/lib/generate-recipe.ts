import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";

const anthropic = new Anthropic();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

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

const RECIPE_PROMPT = (dishName: string) =>
  `Write an original recipe for "${dishName}". Return ONLY valid JSON with this exact structure, no other text. Do not wrap the JSON in code fences or markdown.

{
  "title": "Recipe Title",
  "description": "A short introduction (under 100 words) written in the first person as a home cook. Warm, conversational tone. Mention at least one health benefit of a key ingredient and one practical advantage (speed, cost, simplicity). No hyphens or em dashes. Plain flowing prose, no title or formatting.",
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
  "categories": ["<choose from allowed list>"],
  "nutrition": {"calories": 450, "protein": 25.0, "carbs": 55.0, "fat": 12.0, "fiber": 6.0, "sugar": 8.0}
}

Rules:
- difficulty must be "Easy", "Medium", or "Hard"
- dietaryTags can include: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Nut-Free (only if truly applicable)
- categories can include: Breakfast, Lunch, Dinner, Desserts, Snacks, Sides, Baking, Drinks
- prepTime and cookTime in minutes
- Write genuinely original instructions in your own words
- Use simple, round quantities — e.g. "400" ml not "473.18" ml, "200" g not "226.8" g. Never use decimal places in quantities
- Use metric units (g, ml, kg, L) with round numbers. Do NOT convert from US cups/oz — just write sensible metric amounts directly
- Include 6-15 ingredients and 4-10 steps
- unit can be null for items counted whole (e.g. "2 eggs")
- notes can be null if no preparation notes needed
- nutrition: estimate calories (int, kcal), protein, carbs, fat, fiber, sugar (floats, grams) PER SERVING`;

function repairJson(raw: string): string {
  // Strip non-printable control characters first (keep newline/tab)
  const stripped = raw.replace(/[\x00-\x1F\x7F]/g, (ch) =>
    ch === "\n" || ch === "\r" || ch === "\t" ? ch : ""
  );
  try {
    return jsonrepair(stripped);
  } catch {
    // Fall back to basic regex cleanup if jsonrepair also fails
    return stripped.replace(/,\s*([}\]])/g, "$1");
  }
}

function parseRecipeJson(text: string, dishName: string): GeneratedRecipe {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response for "${dishName}"`);
  }

  const cleaned = repairJson(jsonMatch[0]);

  let parsed: GeneratedRecipe;
  try {
    parsed = JSON.parse(cleaned) as GeneratedRecipe;
  } catch (err) {
    throw new Error(
      `Malformed JSON for "${dishName}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!parsed.title || !parsed.ingredients?.length || !parsed.steps?.length) {
    throw new Error(`Invalid recipe data for "${dishName}"`);
  }

  // Coerce numeric quantities to strings and round overly precise values
  for (const ing of parsed.ingredients) {
    ing.quantity = String(ing.quantity ?? "");
    const num = parseFloat(ing.quantity);
    if (!isNaN(num) && ing.quantity.includes(".")) {
      if (num >= 10) {
        ing.quantity = String(Math.round(num / 5) * 5 || 5);
      } else {
        ing.quantity = String(Math.round(num * 2) / 2 || 0.5);
      }
    }
  }

  return parsed;
}

/**
 * Generate a recipe using Claude (Anthropic API).
 */
export async function generateRecipe(
  dishName: string
): Promise<GeneratedRecipe> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: RECIPE_PROMPT(dishName) }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return parseRecipeJson(text, dishName);
  } catch {
    // Retry once with a stricter prompt
    const retry = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `The following JSON is invalid. Fix it and return ONLY the corrected JSON, nothing else:\n\n${text}`,
        },
      ],
    });
    const retryText =
      retry.content[0].type === "text" ? retry.content[0].text : "";
    return parseRecipeJson(retryText, dishName);
  }
}

async function ollamaChat(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.message?.content || "";
}

/**
 * Generate a recipe using a local Ollama model (e.g. Mistral).
 * Retries once with a repair prompt if the first response is invalid JSON.
 */
export async function generateRecipeLocal(
  dishName: string
): Promise<GeneratedRecipe> {
  const text = await ollamaChat(RECIPE_PROMPT(dishName));

  try {
    return parseRecipeJson(text, dishName);
  } catch (firstErr) {
    console.warn(
      `  JSON parse failed for "${dishName}", retrying with repair prompt...`
    );
    // Ask the model to fix its own output
    const repairPrompt = `The following text was supposed to be valid JSON for a recipe but contains errors. Return ONLY the corrected valid JSON, no other text, no code fences:\n\n${text}`;
    const repaired = await ollamaChat(repairPrompt);
    try {
      return parseRecipeJson(repaired, dishName);
    } catch {
      throw new Error(
        `Failed to generate valid JSON for "${dishName}" after retry. Original error: ${firstErr instanceof Error ? firstErr.message : String(firstErr)}`
      );
    }
  }
}

/**
 * Generate a recipe using the provider configured in RECIPE_LLM_PROVIDER.
 * Defaults to "claude" if not set.
 */
export async function generateRecipeAuto(
  dishName: string
): Promise<GeneratedRecipe> {
  const provider = process.env.RECIPE_LLM_PROVIDER || "claude";
  if (provider === "local") {
    return generateRecipeLocal(dishName);
  }
  return generateRecipe(dishName);
}
