import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Fetch all published recipes with content metrics
  const recipes = await prisma.recipe.findMany({
    where: { published: true },
    include: {
      steps: { select: { instruction: true } },
      ingredients: true,
      categories: { include: { category: true } },
    },
  });

  // Categories where simple recipes are expected (fewer steps/ingredients is normal)
  const simpleCategories = new Set(["Drinks", "Snacks", "Sides"]);

  // Compute content scores
  const scored = recipes.map((r) => {
    const descLen = (r.description || "").length;
    const stepCount = r.steps.length;
    const totalStepWords = r.steps.reduce(
      (sum, s) => sum + (s.instruction || "").split(/\s+/).length,
      0
    );
    const ingCount = r.ingredients.length;
    const hasIntro = !!r.introGeneratedAt;
    const hasImage = !!r.heroImage && !r.heroImage.includes("placehold");
    const cats = r.categories.map((c) => c.category.name);
    const isSimpleCategory = cats.some((c) => simpleCategories.has(c));

    // Description starting with "Preheat" is just step 1 copied, not a real intro
    const descIsStep = /^(preheat|combine|mix|bring|heat|melt|place|cook|stir)/i.test(
      (r.description || "").trim()
    );

    // Adjust expectations for simple categories (drinks, snacks, sides)
    const expectedSteps = isSimpleCategory ? 3 : 8;
    const expectedStepWords = isSimpleCategory ? 40 : 150;
    const expectedIngs = isSimpleCategory ? 3 : 8;

    // Score each aspect (0-1)
    const descScore = descIsStep || !hasIntro
      ? Math.min(descLen / 500, 1) * 0.3 // penalise non-intro descriptions
      : Math.min(descLen / 500, 1);
    const stepScore = Math.min(stepCount / expectedSteps, 1);
    const stepWordScore = Math.min(totalStepWords / expectedStepWords, 1);
    const ingScore = Math.min(ingCount / expectedIngs, 1);
    const imageScore = hasImage ? 1 : 0;

    // Weighted content quality score (0-100)
    const contentScore = Math.round(
      (descScore * 30 + stepScore * 20 + stepWordScore * 20 + ingScore * 15 + imageScore * 15)
    );

    const issues: string[] = [];
    if (descLen < 100) issues.push("Very short description");
    if (descIsStep) issues.push("Description is just step 1");
    if (!hasIntro) issues.push("No generated introduction");
    if (stepCount <= (isSimpleCategory ? 1 : 3)) issues.push("Very few steps");
    if (totalStepWords < (isSimpleCategory ? 15 : 60)) issues.push("Steps lack detail");
    if (ingCount <= (isSimpleCategory ? 1 : 3)) issues.push("Very few ingredients");
    if (!hasImage) issues.push("No image");

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      source: r.source,
      heroImage: r.heroImage || "",
      categories: r.categories.map((c) => c.category.name),
      contentScore,
      descriptionLength: descLen,
      descriptionIsStep: descIsStep,
      hasIntro,
      stepCount,
      totalStepWords,
      ingredientCount: ingCount,
      hasImage,
      issues,
    };
  });

  // Filter to recipes that Google would flag as thin/duplicate content
  const thin = scored
    .filter((r) => r.contentScore < 50 || r.issues.length >= 3)
    .sort((a, b) => a.contentScore - b.contentScore);

  return NextResponse.json({
    totalFlagged: thin.length,
    totalPublished: recipes.length,
    recipes: thin,
  });
}
