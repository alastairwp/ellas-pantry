import type { Fetcher, ScrapedRecipeSignal } from "../lib/types.js";
import { extractJsonLdRecipes, extractLinksFromHtml } from "../lib/parser.js";

const SOURCE_SITE = "delicious";
const BASE_URL = "https://www.deliciousmagazine.co.uk";

const CATEGORY_PATHS = [
  "/recipes/quick-easy",
  "/recipes/midweek-dinners",
  "/recipes/healthy",
  "/recipes/vegetarian",
  "/recipes/vegan",
  "/recipes/baking",
  "/recipes/cakes-baking",
  "/recipes/soups",
  "/recipes/salads",
  "/recipes/pasta",
  "/recipes/chicken",
  "/recipes/fish-seafood",
  "/recipes/comfort-food",
  "/recipes/christmas",
  "/recipes/easter",
  "/recipes/summer",
  "/recipes/autumn",
  "/recipes/bbq",
  "/recipes/brunch-breakfast",
  "/recipes/desserts",
];

export const name = "Delicious Magazine";
export const sourceSite = SOURCE_SITE;

export async function scrape(fetcher: Fetcher): Promise<ScrapedRecipeSignal[]> {
  const allSignals = new Map<string, ScrapedRecipeSignal>();
  const recipeUrls = new Set<string>();

  console.log(`[${SOURCE_SITE}] Scraping category pages...`);

  for (const path of CATEGORY_PATHS) {
    const url = `${BASE_URL}${path}`;
    const html = await fetcher.fetch(url);
    if (!html) continue;

    const links = extractLinksFromHtml(html, url, 'a[href*="/recipes/"]');
    const recipeLinks = links.filter(
      (l) => {
        const pathname = new URL(l).pathname;
        // Recipe pages have deeper paths like /recipes/category/recipe-name
        const segments = pathname.split("/").filter(Boolean);
        return segments.length >= 3 && segments[0] === "recipes";
      }
    );
    for (const link of recipeLinks) {
      recipeUrls.add(link);
    }
    console.log(`  ${path} → ${recipeLinks.length} recipe links`);
  }

  console.log(`[${SOURCE_SITE}] Found ${recipeUrls.size} unique recipe URLs`);

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
