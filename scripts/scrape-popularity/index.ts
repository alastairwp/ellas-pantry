import { PrismaClient } from "@prisma/client";
import { createFetcher } from "./lib/fetcher.js";
import type { ScrapedRecipeSignal, Scraper } from "./lib/types.js";

import * as bbcgoodfood from "./scrapers/bbcgoodfood.js";
import * as delicious from "./scrapers/delicious.js";
import * as simplyrecipes from "./scrapers/simplyrecipes.js";
import * as foodcom from "./scrapers/food-com.js";
import * as loveandlemons from "./scrapers/loveandlemons.js";

const prisma = new PrismaClient();

const SCRAPERS: Record<string, Scraper> = {
  bbcgoodfood,
  delicious,
  simplyrecipes,
  foodcom: foodcom,
  loveandlemons,
};

function parseArgs() {
  const args = process.argv.slice(2);
  let site = "all";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--site" && args[i + 1]) {
      site = args[i + 1];
      i++;
    }
    if (args[i] === "--dry-run") dryRun = true;
  }

  return { site, dryRun };
}

async function upsertSignals(signals: ScrapedRecipeSignal[], dryRun: boolean) {
  let newCount = 0;
  let updatedCount = 0;

  for (const signal of signals) {
    if (dryRun) {
      const existing = await prisma.externalRecipe.findUnique({
        where: { sourceUrl: signal.sourceUrl },
      });
      if (existing) updatedCount++;
      else newCount++;
      continue;
    }

    const existing = await prisma.externalRecipe.findUnique({
      where: { sourceUrl: signal.sourceUrl },
    });

    const recipeData = {
      title: signal.title,
      description: signal.description,
      ratingValue: signal.ratingValue,
      ratingCount: signal.ratingCount,
      reviewCount: signal.reviewCount,
      prepTime: signal.prepTime,
      cookTime: signal.cookTime,
      servings: signal.servings,
      categories: signal.categories,
      seasonalTags: signal.seasonalTags,
      ingredients: signal.ingredients.length > 0 ? signal.ingredients : undefined,
      instructions: signal.instructions.length > 0 ? signal.instructions : undefined,
      publishedAt: signal.publishedAt,
    };

    if (existing) {
      await prisma.externalRecipe.update({
        where: { sourceUrl: signal.sourceUrl },
        data: { ...recipeData, updatedAt: new Date() },
      });
      updatedCount++;
    } else {
      await prisma.externalRecipe.create({
        data: {
          sourceSite: signal.sourceSite,
          sourceUrl: signal.sourceUrl,
          ...recipeData,
        },
      });
      newCount++;
    }
  }

  return { newCount, updatedCount };
}

async function runScraper(scraperKey: string, dryRun: boolean) {
  const scraper = SCRAPERS[scraperKey];
  if (!scraper) {
    console.error(`Unknown scraper: ${scraperKey}. Available: ${Object.keys(SCRAPERS).join(", ")}`);
    return;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Starting: ${scraper.name}`);
  console.log(`${"=".repeat(60)}`);

  // Create audit record
  let scrapeRunId: number | null = null;
  if (!dryRun) {
    const run = await prisma.scrapeRun.create({
      data: { sourceSite: scraper.sourceSite },
    });
    scrapeRunId = run.id;
  }

  const fetcher = createFetcher();
  let signals: ScrapedRecipeSignal[] = [];
  let errors = 0;

  try {
    signals = await scraper.scrape(fetcher);
  } catch (err) {
    console.error(`[${scraperKey}] Fatal error:`, err);
    errors++;
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] ${scraper.name}: ${signals.length} recipes found`);
    if (signals.length > 0) {
      console.log("Sample entries:");
      for (const s of signals.slice(0, 5)) {
        console.log(`  - "${s.title}" (rating: ${s.ratingValue ?? "N/A"}, count: ${s.ratingCount ?? "N/A"})`);
      }
    }
    return;
  }

  const { newCount, updatedCount } = await upsertSignals(signals, dryRun);

  // Update audit record
  if (scrapeRunId) {
    await prisma.scrapeRun.update({
      where: { id: scrapeRunId },
      data: {
        recipesFound: signals.length,
        recipesNew: newCount,
        recipesUpdated: updatedCount,
        errors,
        finishedAt: new Date(),
        status: errors > 0 ? "failed" : "completed",
      },
    });
  }

  console.log(`\n[${scraper.name}] Done: ${signals.length} found, ${newCount} new, ${updatedCount} updated, ${errors} errors`);
}

async function main() {
  const { site, dryRun } = parseArgs();

  if (dryRun) console.log("*** DRY RUN MODE — no database writes ***\n");

  const scraperKeys = site === "all" ? Object.keys(SCRAPERS) : [site];

  for (const key of scraperKeys) {
    await runScraper(key, dryRun);
  }

  await prisma.$disconnect();
  console.log("\nAll done.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  prisma.$disconnect();
  process.exit(1);
});
