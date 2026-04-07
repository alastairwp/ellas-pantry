import type { Fetcher, ScrapedRecipeSignal } from "../lib/types.js";
import { extractJsonLdRecipes, extractLinksFromHtml } from "../lib/parser.js";

const SOURCE_SITE = "foodcom";
const BASE_URL = "https://www.food.com";

// Food.com has curated "best of" and popular category pages
const CATEGORY_PATHS = [
  "/ideas/popular-recipes-6000",
  "/ideas/easy-dinner-recipes-6007",
  "/ideas/quick-and-easy-6001",
  "/ideas/healthy-recipes-6006",
  "/ideas/chicken-recipes-6002",
  "/ideas/vegetarian-recipes-6009",
  "/ideas/baking-recipes-6003",
  "/ideas/pasta-recipes-6008",
  "/ideas/soup-recipes-6005",
  "/ideas/salad-recipes-6004",
  "/ideas/slow-cooker-recipes-6010",
  "/ideas/breakfast-recipes-6011",
  "/ideas/dessert-recipes-6012",
];

export const name = "Food.com";
export const sourceSite = SOURCE_SITE;

export async function scrape(fetcher: Fetcher): Promise<ScrapedRecipeSignal[]> {
  const allSignals = new Map<string, ScrapedRecipeSignal>();
  const recipeUrls = new Set<string>();

  console.log(`[${SOURCE_SITE}] Scraping category pages...`);

  for (const path of CATEGORY_PATHS) {
    const url = `${BASE_URL}${path}`;
    const html = await fetcher.fetch(url);
    if (!html) continue;

    const links = extractLinksFromHtml(html, url, 'a[href*="/recipe/"]');
    for (const link of links) {
      if (link.includes("/recipe/")) {
        recipeUrls.add(link);
      }
    }
    console.log(`  ${path} → ${links.length} recipe links`);
  }

  // Also try the top-rated recipes browse page
  for (let page = 1; page <= 5; page++) {
    const url = `${BASE_URL}/browse/allrecipes/?pn=${page}&sortby=popular`;
    const html = await fetcher.fetch(url);
    if (!html) continue;

    const links = extractLinksFromHtml(html, url, 'a[href*="/recipe/"]');
    for (const link of links) {
      recipeUrls.add(link);
    }
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
