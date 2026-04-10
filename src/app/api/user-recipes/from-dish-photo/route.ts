import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import {
  parseRecipeJson,
  RECIPE_PROMPT,
  type GeneratedRecipe,
} from "@/lib/generate-recipe";

const anthropic = new Anthropic();

const DISH_PHOTO_PROMPT = `Look at this photo of a finished dish. Identify the dish. Produce a complete recipe that matches what you can see — visible ingredients, garnish, plating, colours, textures, portion size — and add the likely hidden ingredients, seasonings, and techniques a home cook would actually use for that dish. Use your judgement for anything not visible. Keep the title accurate to the dish shown. Do not invent an exotic dish if it looks like a simple one.

Then return the recipe as JSON in exactly the schema and style described below.

${RECIPE_PROMPT("[the dish shown in the photo]")}`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { image } = await request.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid image format. Expected base64 data URL." },
        { status: 400 }
      );
    }
    const mediaType = match[1] as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    const data = match[2];

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            { type: "text", text: DISH_PHOTO_PROMPT },
          ],
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let draft: GeneratedRecipe;
    try {
      draft = parseRecipeJson(text, "dish from photo");
    } catch {
      // Retry once with a repair prompt, mirroring generate-recipe.ts:139-154
      const retry = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: `The following JSON is invalid. Fix it and return ONLY the corrected JSON, nothing else:\n\n${text}`,
          },
        ],
      });
      const retryText =
        retry.content[0].type === "text" ? retry.content[0].text : "";
      try {
        draft = parseRecipeJson(retryText, "dish from photo");
      } catch (err) {
        console.error("Dish photo recipe parse failed:", err);
        return NextResponse.json(
          { error: "Could not understand the dish in this photo. Try another angle or better lighting." },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({
      draft,
      identifiedDishName: draft.title,
    });
  } catch (error) {
    console.error("Dish photo vision error:", error);
    return NextResponse.json(
      { error: "Failed to analyse the photo" },
      { status: 500 }
    );
  }
}
