import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAdaptedSteps } from "@/lib/generate-adapted-steps";
import { checkRecipeAccess } from "@/lib/recipe-access";

const VALID_LEVELS = ["beginner", "advanced"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  const access = await checkRecipeAccess(recipeId);
  if (!access.ok) {
    return NextResponse.json({ error: "Recipe not found" }, { status: access.status });
  }

  const body = await request.json();
  const { skillLevel } = body;

  if (!VALID_LEVELS.includes(skillLevel)) {
    return NextResponse.json(
      { error: "skillLevel must be 'beginner' or 'advanced'" },
      { status: 400 }
    );
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      title: true,
      steps: {
        orderBy: { stepNumber: "asc" },
        select: { stepNumber: true, instruction: true, tipText: true },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (skillLevel === "intermediate") {
    return NextResponse.json({ steps: recipe.steps });
  }

  // Compute content hash
  const hashInput = recipe.steps
    .map((s) => `${s.instruction}|${s.tipText || ""}`)
    .join("||");
  const contentHash = createHash("sha256").update(hashInput).digest("hex");

  // Check cache
  const cached = await prisma.adaptedStepsCache.findUnique({
    where: {
      recipeId_skillLevel_contentHash: {
        recipeId,
        skillLevel,
        contentHash,
      },
    },
  });

  if (cached) {
    return NextResponse.json({ steps: cached.adaptedSteps });
  }

  // Generate adapted steps
  try {
    const adaptedSteps = await generateAdaptedSteps(
      recipe.steps,
      skillLevel,
      recipe.title
    );

    // Cache the result
    await prisma.adaptedStepsCache.upsert({
      where: {
        recipeId_skillLevel_contentHash: {
          recipeId,
          skillLevel,
          contentHash,
        },
      },
      create: { recipeId, skillLevel, contentHash, adaptedSteps: adaptedSteps as unknown as Prisma.InputJsonValue },
      update: { adaptedSteps: adaptedSteps as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({ steps: adaptedSteps });
  } catch {
    return NextResponse.json({
      steps: recipe.steps,
      fallback: true,
    });
  }
}
