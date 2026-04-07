import type { Fetcher, ScrapedRecipeSignal } from "../lib/types.js";
import { extractJsonLdRecipes, extractLinksFromHtml } from "../lib/parser.js";

const SOURCE_SITE = "bbcgoodfood";
const BASE_URL = "https://www.bbcgoodfood.com";

// BBC Good Food organises recipes by collection pages
const COLLECTION_PATHS = [
  "/recipes/collection/easy-dinner-recipes",
  "/recipes/collection/quick-and-easy-recipes",
  "/recipes/collection/healthy-dinner-recipes",
  "/recipes/collection/vegetarian-recipes",
  "/recipes/collection/vegan-recipes",
  "/recipes/collection/chicken-recipes",
  "/recipes/collection/pasta-recipes",
  "/recipes/collection/soup-recipes",
  "/recipes/collection/cake-recipes",
  "/recipes/collection/baking-recipes",
  "/recipes/collection/bread-recipes",
  "/recipes/collection/salad-recipes",
  "/recipes/collection/curry-recipes",
  "/recipes/collection/slow-cooker-recipes",
  "/recipes/collection/sunday-lunch-recipes",
  "/recipes/collection/budget-meals",
  "/recipes/collection/family-recipes",
  "/recipes/collection/meal-prep-recipes",
  "/recipes/collection/stir-fry-recipes",
  "/recipes/collection/breakfast-recipes",
  "/recipes/collection/lunch-recipes",
  "/recipes/collection/christmas-recipes",
  "/recipes/collection/easter-recipes",
  "/recipes/collection/summer-recipes",
  "/recipes/collection/autumn-recipes",
  "/recipes/collection/winter-recipes",
  "/recipes/collection/bbq-recipes",
];

export const name = "BBC Good Food";
export const sourceSite = SOURCE_SITE;

export async function scrape(fetcher: Fetcher): Promise<ScrapedRecipeSignal[]> {
  const allSignals = new Map<string, ScrapedRecipeSignal>();
  const recipeUrls = new Set<string>();

  console.log(`[${SOURCE_SITE}] Scraping collection pages...`);

  // Phase 1: Gather recipe URLs from collection pages
  for (const path of COLLECTION_PATHS) {
    const url = `${BASE_URL}${path}`;
    const html = await fetcher.fetch(url);
    if (!html) continue;

    const links = extractLinksFromHtml(html, url, 'a[href*="/recipes/"]');
    const recipeLinks = links.filter(
      (l) => l.includes("/recipes/") && !l.includes("/collection/") && !l.includes("/category/")
    );
    for (const link of recipeLinks) {
      recipeUrls.add(link);
    }
    console.log(`  ${path} → ${recipeLinks.length} recipe links`);
  }

  console.log(`[${SOURCE_SITE}] Found ${recipeUrls.size} unique recipe URLs`);

  // Phase 2: Fetch individual recipe pages for JSON-LD data
  let processed = 0;
  for (const url of recipeUrls) {
    const html = await fetcher.fetch(url);
    if (!html) continue;

    const signals = extractJsonLdRecipes(html, url, SOURCE_SITE);
    for (const signal of signals) {
      if (!allSignals.has(signal.sourceUrl)) {
        allSignals.set(signal.sourceUrl, signal);
      }
    }

    processed++;
    if (processed % 50 === 0) {
      console.log(`  [${SOURCE_SITE}] Processed ${processed}/${recipeUrls.size}`);
    }
  }

  console.log(`[${SOURCE_SITE}] Scraped ${allSignals.size} recipes`);
  return [...allSignals.values()];
}
