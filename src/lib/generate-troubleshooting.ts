import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface TroubleshootingCause {
  cause: string;
  likelihood: "high" | "medium" | "low";
  relatedStep: number | null;
}

export interface TroubleshootingResult {
  diagnosis: string;
  causes: TroubleshootingCause[];
  fixes: string[];
  salvage: string | null;
}

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string | null;
}

interface StepInput {
  stepNumber: number;
  instruction: string;
}

export async function generateTroubleshooting(
  recipeTitle: string,
  ingredients: IngredientInput[],
  steps: StepInput[],
  difficulty: string,
  problemDescription: string
): Promise<TroubleshootingResult> {
  const ingredientList = ingredients
    .map((i) => `${i.quantity}${i.unit ? ` ${i.unit}` : ""} ${i.name}`)
    .join("\n");

  const stepList = steps
    .map((s) => `Step ${s.stepNumber}: ${s.instruction}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are an expert cooking troubleshooter. A user just finished making "${recipeTitle}" (difficulty: ${difficulty}) and something went wrong. Analyze their problem against the specific recipe and provide a diagnosis.

Ingredients:
${ingredientList}

Steps:
${stepList}

The user's problem: "${problemDescription}"

Provide:
1. A brief diagnosis summarizing what likely happened
2. Ranked causes (high/medium/low likelihood), referencing specific step numbers where relevant
3. Actionable fixes for next time
4. If the dish can be salvaged, explain how (otherwise null)

Return ONLY valid JSON with this exact structure, no other text:
{
  "diagnosis": "One or two sentence summary of what went wrong",
  "causes": [
    {
      "cause": "Description of what caused the problem",
      "likelihood": "high",
      "relatedStep": 3
    }
  ],
  "fixes": [
    "Specific actionable fix for next time"
  ],
  "salvage": "How to save the current dish, or null if not salvageable"
}

Rules:
- Reference specific step numbers from the recipe when relevant (use null if not step-related)
- Keep causes to 2-4 items, ranked by likelihood
- Keep fixes to 2-4 items, each specific and actionable
- Salvage advice should be practical for the dish as-is
- Keep all text concise`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse troubleshooting JSON");
  }

  const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(cleaned);

  const causes: TroubleshootingCause[] = Array.isArray(parsed.causes)
    ? parsed.causes.map((c: TroubleshootingCause) => ({
        cause: c.cause,
        likelihood: ["high", "medium", "low"].includes(c.likelihood)
          ? c.likelihood
          : "medium",
        relatedStep:
          typeof c.relatedStep === "number" ? c.relatedStep : null,
      }))
    : [];

  const fixes: string[] = Array.isArray(parsed.fixes)
    ? parsed.fixes.filter((f: unknown) => typeof f === "string")
    : [];

  return {
    diagnosis: parsed.diagnosis || "",
    causes,
    fixes,
    salvage: typeof parsed.salvage === "string" ? parsed.salvage : null,
  };
}
