import type { Fetcher, ScrapedRecipeSignal } from "../lib/types.js";
import { extractJsonLdRecipes, extractLinksFromSitemap } from "../lib/parser.js";

const SOURCE_SITE = "simplyrecipes";
const BASE_URL = "https://www.simplyrecipes.com";

export const name = "Simply Recipes";
export const sourceSite = SOURCE_SITE;

export async function scrape(fetcher: Fetcher): Promise<ScrapedRecipeSignal[]> {
  const allSignals = new Map<string, ScrapedRecipeSignal>();
  const recipeUrls = new Set<string>();

  console.log(`[${SOURCE_SITE}] Fetching sitemap...`);

  // Simply Recipes has a sitemap index
  const sitemapIndex = await fetcher.fetch(`${BASE_URL}/sitemap_1.xml`);
  if (sitemapIndex) {
    const urls = extractLinksFromSitemap(sitemapIndex);
    // Filter to recipe pages (they tend to have slugs without deep paths)
    for (const url of urls) {
      if (url.includes("/recipes/") || url.includes("simplyrecipes.com/")) {
        recipeUrls.add(url);
      }
    }
  }

  // Also try the main sitemap
  const mainSitemap = await fetcher.fetch(`${BASE_URL}/sitemap.xml`);
  if (mainSitemap) {
    const urls = extractLinksFromSitemap(mainSitemap);
    // Sub-sitemaps
    const subSitemaps = urls.filter((u) => u.endsWith(".xml"));
    for (const subUrl of subSitemaps.slice(0, 5)) {
      const subXml = await fetcher.fetch(subUrl);
      if (!subXml) continue;
      const subUrls = extractLinksFromSitemap(subXml);
      for (const url of subUrls) {
        recipeUrls.add(url);
      }
    }

    // Direct recipe URLs
    for (const url of urls.filter((u) => !u.endsWith(".xml"))) {
      recipeUrls.add(url);
    }
  }

  // Cap at 500 recipe pages to be polite
  const urlList = [...recipeUrls].slice(0, 500);
  console.log(`[${SOURCE_SITE}] Found ${recipeUrls.size} URLs, processing ${urlList.length}`);

  let processed = 0;
  for (const url of urlList) {
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
      console.log(`  [${SOURCE_SITE}] Processed ${processed}/${urlList.length}`);
    }
  }

  console.log(`[${SOURCE_SITE}] Scraped ${allSignals.size} recipes`);
  return [...allSignals.values()];
}
