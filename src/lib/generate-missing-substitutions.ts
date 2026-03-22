import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface SubstitutionOption {
  name: string;
  quantity: string;
  notes: string;
}

export interface MissingIngredientResult {
  missing: string;
  role: string;
  canSubstitute: boolean;
  options?: SubstitutionOption[];
  reason?: string;
}

export interface FeasibilityAssessment {
  rating: "easy" | "moderate" | "difficult";
  message: string;
}

export interface MissingSubstitutionsResult {
  substitutions: MissingIngredientResult[];
  feasibility: FeasibilityAssessment;
}

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string | null;
}

export async function generateMissingSubstitutions(
  recipeTitle: string,
  ingredients: IngredientInput[],
  missingIngredients: string[]
): Promise<MissingSubstitutionsResult> {
  const ingredientList = ingredients
    .map((i) => `${i.quantity}${i.unit ? ` ${i.unit}` : ""} ${i.name}`)
    .join("\n");

  const missingList = missingIngredients.join(", ");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a practical cooking assistant. A user is making "${recipeTitle}" and is missing some ingredients. Suggest substitutions.

Full ingredient list:
${ingredientList}

Missing ingredients: ${missingList}

For each missing ingredient:
1. Identify its FUNCTIONAL ROLE in this specific recipe (binding, leavening, fat, flavor, structural, liquid, acidity, etc.)
2. If it can be substituted: suggest 1-2 practical alternatives with adjusted quantities and brief notes about impact
3. If it's a CORE ingredient that defines the dish (e.g. chicken in chicken soup), mark it as not substitutable and explain why

Also assess overall feasibility: given which and how many ingredients are missing, rate whether the dish is still worth making.

Return ONLY valid JSON with this exact structure, no other text:
{
  "substitutions": [
    {
      "missing": "ingredient name",
      "role": "its functional role in this recipe",
      "canSubstitute": true,
      "options": [
        { "name": "substitute name", "quantity": "adjusted quantity", "notes": "brief impact note" }
      ]
    },
    {
      "missing": "core ingredient name",
      "role": "its role in this recipe",
      "canSubstitute": false,
      "reason": "Why this can't be meaningfully substituted"
    }
  ],
  "feasibility": {
    "rating": "easy|moderate|difficult",
    "message": "One sentence assessment of whether the dish is still worth making with these substitutions."
  }
}

Rules:
- Focus on practical, commonly available substitutes
- Quantity adjustments should be specific (e.g. "1/4 cup" not "similar amount")
- "easy" = minor ingredients, dish will be nearly identical
- "moderate" = noticeable differences but still good
- "difficult" = too many core ingredients missing, consider a different recipe
- Keep all text concise`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse missing substitutions JSON");
  }

  const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(cleaned);

  const substitutions: MissingIngredientResult[] = Array.isArray(
    parsed.substitutions
  )
    ? parsed.substitutions.map((s: MissingIngredientResult) => ({
        missing: s.missing,
        role: s.role,
        canSubstitute: s.canSubstitute,
        ...(s.canSubstitute
          ? { options: Array.isArray(s.options) ? s.options : [] }
          : { reason: s.reason || "This is a core ingredient" }),
      }))
    : [];

  const feasibility: FeasibilityAssessment = {
    rating: ["easy", "moderate", "difficult"].includes(
      parsed.feasibility?.rating
    )
      ? parsed.feasibility.rating
      : "moderate",
    message: parsed.feasibility?.message || "",
  };

  return { substitutions, feasibility };
}
