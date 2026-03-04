import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface Substitution {
  original: string;
  replacement: string;
  quantity: string;
  notes: string;
}

export interface SubstitutionResult {
  type: string;
  suggestions: Substitution[];
  tips: string;
}

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string | null;
}

export async function generateSubstitutions(
  ingredients: IngredientInput[],
  type: string
): Promise<SubstitutionResult> {
  const ingredientList = ingredients
    .map((i) => `${i.quantity}${i.unit ? ` ${i.unit}` : ""} ${i.name}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Given these recipe ingredients, suggest substitutions to make the recipe ${type}:

${ingredientList}

Return ONLY valid JSON with this exact structure, no other text:
{
  "suggestions": [
    {
      "original": "butter",
      "replacement": "coconut oil",
      "quantity": "same amount",
      "notes": "May slightly alter texture"
    }
  ],
  "tips": "General tip for making this recipe ${type}"
}

Rules:
- Only include ingredients that NEED to be substituted for the "${type}" variation
- If an ingredient is already compatible, do NOT include it
- If no substitutions are needed, return an empty suggestions array
- Keep notes concise (under 50 words each)
- The tips field should be a single helpful sentence about cooking this variation
- For "budget" type: suggest cheaper alternatives with approximate savings`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse substitutions JSON");
  }

  const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(cleaned);

  return {
    type,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    tips: parsed.tips || "",
  };
}
