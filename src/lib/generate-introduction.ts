import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface IngredientInput {
  name: string;
  quantity: string;
  unit: string | null;
}

export async function generateIntroduction(
  recipeName: string,
  ingredients: IngredientInput[],
  prepTime: number,
  cookTime: number
): Promise<string> {
  const ingredientList = ingredients
    .map((i) => `${i.quantity}${i.unit ? ` ${i.unit}` : ""} ${i.name}`)
    .join(", ");

  const prompt = `Write a short introduction (under 100 words) for a recipe called "${recipeName}".

Ingredients: ${ingredientList}
Prep time: ${prepTime} minutes
Cook time: ${cookTime} minutes

Rules:
- Write in the first person, as if you are a home cook sharing this recipe with a friend
- Warm, natural, conversational tone
- Include at least one health benefit of a key ingredient
- Highlight at least one practical advantage such as speed, low cost, or simplicity
- Do not use hyphens or em dashes anywhere
- Plain flowing prose only. No title, no headings, no bullet points, no formatting
- Do not start with the word "I"
- Return ONLY the introduction text, nothing else`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip any hyphens or dashes that slip through
  return text.replace(/[\u2013\u2014\-]/g, " ").replace(/\s{2,}/g, " ").trim();
}
