import { PrismaClient } from "@prisma/client";
import { titleWords, jaccard } from "../src/lib/similarity.js";

const prisma = new PrismaClient();

// Default weights — can be overridden via Setting model
const DEFAULT_WEIGHTS = {
  external: 0.45,
  internal: 0.25,
  seasonal: 0.30,
};

function parseArgs() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let seasonalOnly = false;

  for (const arg of args) {
    if (arg === "--dry-run") dryRun = true;
    if (arg === "--seasonal-only") seasonalOnly = true;
  }

  return { dryRun, seasonalOnly };
}

async function getWeights() {
  const setting = await prisma.setting.findUnique({
    where: { key: "popularity_weights" },
  });
  if (setting) {
    try {
      return { ...DEFAULT_WEIGHTS, ...JSON.parse(setting.value) };
    } catch {
      // Fall through to defaults
    }
  }
  return DEFAULT_WEIGHTS;
}

async function computeExternalPopularity(
  recipes: { id: number; title: string }[]
) {
  const external = await prisma.externalRecipe.findMany({
    where: {
      ratingCount: { not: null },
      ratingValue: { not: null },
    },
    select: {
      id: true,
      title: true,
      ratingValue: true,
      ratingCount: true,
    },
  });

  if (external.length === 0) {
    console.log("  No external recipes with ratings found — skipping external popularity");
    return new Map<number, { score: number; matchedIds: number[] }>();
  }

  // Pre-compute external title word sets
  const externalTitleSets = external.map((e) => ({
    ...e,
    words: titleWords(e.title),
  }));

  // Phase 1: For each internal recipe, find candidate external matches
  // Track: for each external recipe, which internal recipe is its BEST match
  const externalBestMatch = new Map<number, { recipeId: number; sim: number }>();

  for (const recipe of recipes) {
    const words = titleWords(recipe.title);

    for (const ext of externalTitleSets) {
      const sim = jaccard(words, ext.words);
      if (sim < 0.65) continue;

      // Check containment — the smaller title's words must mostly appear in the larger
      const smaller = words.size <= ext.words.size ? words : ext.words;
      const larger = words.size <= ext.words.size ? ext.words : words;
      let overlap = 0;
      for (const w of smaller) if (larger.has(w)) overlap++;
      const containment = smaller.size > 0 ? overlap / smaller.size : 0;
      if (containment < 0.8) continue;

      // Keep only the single best internal match per external recipe
      const current = externalBestMatch.get(ext.id);
      if (!current || sim > current.sim) {
        externalBestMatch.set(ext.id, { recipeId: recipe.id, sim });
      }
    }
  }

  // Phase 2: Invert — build map of recipeId → matched external recipes
  const recipeExternalMatches = new Map<number, number[]>();
  for (const [extId, { recipeId }] of externalBestMatch) {
    const list = recipeExternalMatches.get(recipeId) || [];
    list.push(extId);
    recipeExternalMatches.set(recipeId, list);
  }

  // Phase 3: Compute raw scores
  const results = new Map<number, { score: number; matchedIds: number[] }>();
  let maxRaw = 0;
  const rawScores = new Map<number, { raw: number; matchedIds: number[] }>();
  const extMap = new Map(external.map((e) => [e.id, e]));

  for (const recipe of recipes) {
    const matchedIds = recipeExternalMatches.get(recipe.id) || [];

    if (matchedIds.length > 0) {
      // Use the best external match (highest ratingCount * ratingValue)
      let bestRaw = 0;
      for (const extId of matchedIds) {
        const ext = extMap.get(extId);
        if (ext?.ratingCount && ext?.ratingValue) {
          const raw = Math.log10(ext.ratingCount + 1) * (ext.ratingValue / 5);
          if (raw > bestRaw) bestRaw = raw;
        }
      }
      rawScores.set(recipe.id, { raw: bestRaw, matchedIds });
      if (bestRaw > maxRaw) maxRaw = bestRaw;
    } else {
      rawScores.set(recipe.id, { raw: 0, matchedIds: [] });
    }
  }

  // Normalise to 0-100
  for (const [recipeId, { raw, matchedIds }] of rawScores) {
    const score = maxRaw > 0 ? (raw / maxRaw) * 100 : 0;
    results.set(recipeId, { score, matchedIds });
  }

  const matched = [...rawScores.values()].filter((r) => r.raw > 0).length;
  console.log(`  Matched ${matched} internal recipes to external data (1:1 matching)`);

  return results;
}

async function computeInternalPopularity(recipeIds: number[]) {
  // Get rating stats
  const ratingStats = await prisma.rating.groupBy({
    by: ["recipeId"],
    _avg: { score: true },
    _count: { score: true },
    where: { recipeId: { in: recipeIds } },
  });

  // Get save counts
  const saveCounts = await prisma.savedRecipe.groupBy({
    by: ["recipeId"],
    _count: { id: true },
    where: { recipeId: { in: recipeIds } },
  });

  // Get content quality indicators
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    select: {
      id: true,
      imageStatus: true,
      introGeneratedAt: true,
    },
  });

  const ratingMap = new Map(
    ratingStats.map((r) => [r.recipeId, { avg: r._avg.score ?? 0, count: r._count.score }])
  );
  const saveMap = new Map(
    saveCounts.map((s) => [s.recipeId, s._count.id])
  );
  const contentMap = new Map(
    recipes.map((r) => [r.id, { hasImage: r.imageStatus === "generated", hasIntro: !!r.introGeneratedAt }])
  );

  // Find max values for normalisation
  const maxRatingCount = Math.max(1, ...ratingStats.map((r) => r._count.score));
  const maxSaveCount = Math.max(1, ...saveCounts.map((s) => s._count.id));

  const results = new Map<number, number>();

  for (const id of recipeIds) {
    const rating = ratingMap.get(id) ?? { avg: 0, count: 0 };
    const saves = saveMap.get(id) ?? 0;
    const content = contentMap.get(id) ?? { hasImage: false, hasIntro: false };

    const ratingAvgNorm = (rating.avg / 5) * 100;
    const ratingCountNorm = maxRatingCount > 1
      ? (Math.log10(rating.count + 1) / Math.log10(maxRatingCount + 1)) * 100
      : 0;
    const saveNorm = maxSaveCount > 1
      ? (Math.log10(saves + 1) / Math.log10(maxSaveCount + 1)) * 100
      : 0;
    const contentScore = ((content.hasImage ? 50 : 0) + (content.hasIntro ? 50 : 0));

    const score =
      ratingAvgNorm * 0.3 +
      ratingCountNorm * 0.3 +
      saveNorm * 0.25 +
      contentScore * 0.15;

    results.set(id, score);
  }

  return results;
}

async function computeSeasonalRelevance(recipeIds: number[]) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Get active occasions
  const occasions = await prisma.occasion.findMany();
  const activeOccasionIds = occasions
    .filter((o) => {
      if (o.startMonth <= o.endMonth) {
        return currentMonth >= o.startMonth && currentMonth <= o.endMonth;
      }
      // Wraps around year end (e.g. Dec-Jan)
      return currentMonth >= o.startMonth || currentMonth <= o.endMonth;
    })
    .map((o) => o.id);

  // Get recipe-occasion links for active occasions
  const recipeOccasions = await prisma.recipeOccasion.findMany({
    where: {
      recipeId: { in: recipeIds },
      occasionId: { in: activeOccasionIds },
    },
    select: { recipeId: true },
  });
  const recipesWithActiveOccasion = new Set(recipeOccasions.map((ro) => ro.recipeId));

  // Get seasonal produce for current month
  const seasonalProduce = await prisma.seasonalProduce.findMany({
    where: { monthsInSeason: { has: currentMonth } },
    select: { searchTerms: true },
  });
  const seasonalTerms = new Set(
    seasonalProduce.flatMap((p) => p.searchTerms.map((t) => t.toLowerCase()))
  );

  // Get recipe ingredients
  const recipeIngredients = await prisma.recipeIngredient.findMany({
    where: { recipeId: { in: recipeIds } },
    select: { recipeId: true, ingredient: { select: { name: true } } },
  });

  // Group ingredients by recipe
  const ingredientsByRecipe = new Map<number, string[]>();
  for (const ri of recipeIngredients) {
    const list = ingredientsByRecipe.get(ri.recipeId) || [];
    list.push(ri.ingredient.name.toLowerCase());
    ingredientsByRecipe.set(ri.recipeId, list);
  }

  const results = new Map<number, number>();

  for (const id of recipeIds) {
    let score = 0;

    // Occasion boost: +50 if linked to an active occasion
    if (recipesWithActiveOccasion.has(id)) {
      score += 50;
    }

    // Produce boost: up to +50 based on seasonal ingredient fraction
    const ingredients = ingredientsByRecipe.get(id) || [];
    if (ingredients.length > 0 && seasonalTerms.size > 0) {
      let seasonalCount = 0;
      for (const ing of ingredients) {
        for (const term of seasonalTerms) {
          if (ing.includes(term)) {
            seasonalCount++;
            break;
          }
        }
      }
      const fraction = seasonalCount / ingredients.length;
      score += fraction * 50;
    }

    results.set(id, score);
  }

  return results;
}

async function main() {
  const { dryRun, seasonalOnly } = parseArgs();

  if (dryRun) console.log("*** DRY RUN MODE ***\n");

  const weights = await getWeights();
  console.log(`Weights: external=${weights.external}, internal=${weights.internal}, seasonal=${weights.seasonal}`);

  // Get all published recipes
  const recipes = await prisma.recipe.findMany({
    where: { published: true },
    select: { id: true, title: true },
  });
  console.log(`Found ${recipes.length} published recipes`);

  const recipeIds = recipes.map((r) => r.id);

  if (seasonalOnly) {
    console.log("\nComputing seasonal relevance only...");
    const seasonal = await computeSeasonalRelevance(recipeIds);

    if (!dryRun) {
      let updated = 0;
      for (const [recipeId, seasonalRelevance] of seasonal) {
        const existing = await prisma.recipePopularity.findUnique({
          where: { recipeId },
        });
        if (existing) {
          const compositeScore =
            existing.externalPopularity * weights.external +
            existing.internalPopularity * weights.internal +
            seasonalRelevance * weights.seasonal;

          await prisma.recipePopularity.update({
            where: { recipeId },
            data: { seasonalRelevance, compositeScore, computedAt: new Date() },
          });
          updated++;
        }
      }
      console.log(`Updated seasonal relevance for ${updated} recipes`);
    }
    await prisma.$disconnect();
    return;
  }

  // Full computation
  console.log("\nComputing external popularity...");
  const externalScores = await computeExternalPopularity(recipes);

  console.log("Computing internal popularity...");
  const internalScores = await computeInternalPopularity(recipeIds);

  console.log("Computing seasonal relevance...");
  const seasonalScores = await computeSeasonalRelevance(recipeIds);

  // Combine and upsert
  let upserted = 0;
  const scoreSamples: { title: string; composite: number; ext: number; int: number; sea: number }[] = [];

  for (const recipe of recipes) {
    const ext = externalScores.get(recipe.id)?.score ?? 0;
    const matchedIds = externalScores.get(recipe.id)?.matchedIds ?? [];
    const int = internalScores.get(recipe.id) ?? 0;
    const sea = seasonalScores.get(recipe.id) ?? 0;

    const composite = ext * weights.external + int * weights.internal + sea * weights.seasonal;

    if (dryRun) {
      if (composite > 0) {
        scoreSamples.push({ title: recipe.title, composite, ext, int, sea });
      }
    } else {
      await prisma.recipePopularity.upsert({
        where: { recipeId: recipe.id },
        create: {
          recipeId: recipe.id,
          externalPopularity: ext,
          internalPopularity: int,
          seasonalRelevance: sea,
          compositeScore: composite,
          matchedExternalIds: matchedIds,
        },
        update: {
          externalPopularity: ext,
          internalPopularity: int,
          seasonalRelevance: sea,
          compositeScore: composite,
          matchedExternalIds: matchedIds,
          computedAt: new Date(),
        },
      });
      upserted++;
    }
  }

  if (dryRun) {
    scoreSamples.sort((a, b) => b.composite - a.composite);
    console.log(`\nTop 20 recipes by composite score:`);
    for (const s of scoreSamples.slice(0, 20)) {
      console.log(
        `  ${s.composite.toFixed(1).padStart(5)} | ext=${s.ext.toFixed(0).padStart(3)} int=${s.int.toFixed(0).padStart(3)} sea=${s.sea.toFixed(0).padStart(3)} | ${s.title}`
      );
    }
    console.log(`\nTotal with score > 0: ${scoreSamples.length}/${recipes.length}`);
  } else {
    console.log(`\nUpserted popularity scores for ${upserted} recipes`);
  }

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  prisma.$disconnect();
  process.exit(1);
});
