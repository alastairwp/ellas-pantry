import type { Fetcher, ScrapedRecipeSignal } from "../lib/types.js";
import { extractJsonLdRecipes, extractLinksFromHtml } from "../lib/parser.js";

const SOURCE_SITE = "loveandlemons";
const BASE_URL = "https://www.loveandlemons.com";

const CATEGORY_PATHS = [
  "/category/dinner-ideas",
  "/category/lunch-ideas",
  "/category/breakfast-ideas",
  "/category/appetizers",
  "/category/soups",
  "/category/salads",
  "/category/pasta",
  "/category/baking",
  "/category/desserts",
  "/category/vegan-recipes",
  "/category/gluten-free-recipes",
  "/category/healthy-recipes",
  "/category/seasonal/summer-recipes",
  "/category/seasonal/fall-recipes",
  "/category/seasonal/winter-recipes",
  "/category/seasonal/spring-recipes",
  "/category/holiday/christmas-recipes",
  "/category/holiday/thanksgiving-recipes",
  "/category/holiday/easter-recipes",
];

export const name = "Love and Lemons";
export const sourceSite = SOURCE_SITE;

export async function scrape(fetcher: Fetcher): Promise<ScrapedRecipeSignal[]> {
  const allSignals = new Map<string, ScrapedRecipeSignal>();
  const recipeUrls = new Set<string>();

  console.log(`[${SOURCE_SITE}] Scraping category pages...`);

  for (const path of CATEGORY_PATHS) {
    const url = `${BASE_URL}${path}`;
    const html = await fetcher.fetch(url);
    if (!html) continue;

    // Love and Lemons uses simple post links
    const links = extractLinksFromHtml(html, url, "a[href]");
    const recipeLinks = links.filter((l) => {
      const u = new URL(l);
      return (
        u.hostname === "www.loveandlemons.com" &&
        !u.pathname.includes("/category/") &&
        !u.pathname.includes("/page/") &&
        !u.pathname.includes("/tag/") &&
        u.pathname.split("/").filter(Boolean).length === 1 &&
        u.pathname !== "/"
      );
    });
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
