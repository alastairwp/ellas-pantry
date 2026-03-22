import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface AdaptedStep {
  stepNumber: number;
  instruction: string;
  tipText: string | null;
}

export async function generateAdaptedSteps(
  steps: { stepNumber: number; instruction: string; tipText?: string | null }[],
  skillLevel: "beginner" | "advanced",
  recipeTitle: string
): Promise<AdaptedStep[]> {
  const stepsText = steps
    .map((s) => `Step ${s.stepNumber}: ${s.instruction}${s.tipText ? ` [Tip: ${s.tipText}]` : ""}`)
    .join("\n");

  const prompt =
    skillLevel === "beginner"
      ? `You are a friendly cooking instructor adapting recipe steps for a beginner cook.

Recipe: ${recipeTitle}

Original steps:
${stepsText}

Rewrite each step with:
- Expanded instructions that explain techniques (e.g. "dice" → explain how to dice)
- Visual cues so they know when something is done (e.g. "until golden brown and edges are crispy")
- Safety callouts where relevant (e.g. hot oil, sharp knives)
- A warm, encouraging tone
- A helpful tipText for EVERY step

You MUST return exactly ${steps.length} steps. Return ONLY a JSON array, no other text:
[{"stepNumber": 1, "instruction": "...", "tipText": "..."}, ...]`
      : `You are a professional chef writing concise recipe steps for an experienced cook.

Recipe: ${recipeTitle}

Original steps:
${stepsText}

Rewrite each step with:
- Professional culinary terminology
- Concise, efficient language — no unnecessary explanation
- Assume knowledge of techniques, temperatures, and timing

Set tipText to null for every step.

You MUST return exactly ${steps.length} steps. Return ONLY a JSON array, no other text:
[{"stepNumber": 1, "instruction": "...", "tipText": null}, ...]`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse adapted steps JSON");
  }

  const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed: AdaptedStep[] = JSON.parse(cleaned);

  if (parsed.length !== steps.length) {
    throw new Error(
      `Step count mismatch: expected ${steps.length}, got ${parsed.length}`
    );
  }

  return parsed;
}
