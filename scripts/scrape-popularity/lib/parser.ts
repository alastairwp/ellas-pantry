import * as cheerio from "cheerio";
import type { ScrapedRecipeSignal } from "./types.js";

interface JsonLdRecipe {
  "@type": string | string[];
  name?: string;
  headline?: string;
  description?: string;
  aggregateRating?: {
    ratingValue?: number | string;
    ratingCount?: number | string;
    reviewCount?: number | string;
  };
  recipeCategory?: string | string[];
  keywords?: string | string[];
  datePublished?: string;
  url?: string;
  prepTime?: string; // ISO 8601 duration e.g. "PT15M"
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number | string[];
  recipeIngredient?: string[];
  recipeInstructions?: (string | { "@type"?: string; text?: string; name?: string })[];
  image?: string | string[] | { url?: string };
}

/** Parse ISO 8601 duration (e.g. "PT1H30M", "PT45M") to minutes */
function parseDuration(iso: string | undefined): number | null {
  if (!iso) return null;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

/** Extract step text from recipeInstructions (handles strings and HowToStep objects) */
function extractInstructions(raw: JsonLdRecipe["recipeInstructions"]): string[] {
  if (!raw || !Array.isArray(raw)) return [];
  const steps: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) steps.push(trimmed);
    } else if (item && typeof item === "object") {
      const text = item.text?.trim();
      if (text) steps.push(text);
    }
  }
  return steps;
}

/** Parse recipeYield to a servings number */
function parseServings(raw: string | number | string[] | undefined): number | null {
  if (raw == null) return null;
  const str = Array.isArray(raw) ? raw[0] : String(raw);
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function extractJsonLdRecipes(html: string, sourceUrl: string, sourceSite: string): ScrapedRecipeSignal[] {
  const $ = cheerio.load(html);
  const results: ScrapedRecipeSignal[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text();
      const data = JSON.parse(text);

      // JSON-LD can be a single object, an array, or a @graph
      const items: JsonLdRecipe[] = [];
      if (Array.isArray(data)) {
        items.push(...data);
      } else if (data["@graph"]) {
        items.push(...data["@graph"]);
      } else {
        items.push(data);
      }

      for (const item of items) {
        const type = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        if (!type.includes("Recipe")) continue;

        const title = item.name || item.headline;
        if (!title) continue;

        const rating = item.aggregateRating;
        const ratingValue = rating?.ratingValue ? parseFloat(String(rating.ratingValue)) : null;
        const ratingCount = rating?.ratingCount ? parseInt(String(rating.ratingCount), 10) : null;
        const reviewCount = rating?.reviewCount ? parseInt(String(rating.reviewCount), 10) : null;

        const rawCategories = item.recipeCategory
          ? (Array.isArray(item.recipeCategory) ? item.recipeCategory : [item.recipeCategory])
          : [];
        const rawKeywords = item.keywords
          ? (Array.isArray(item.keywords) ? item.keywords : item.keywords.split(",").map((k: string) => k.trim()))
          : [];

        const categories = rawCategories.map((c) => c.toLowerCase().trim());
        const seasonalTags = extractSeasonalTags([...rawKeywords, ...rawCategories]);

        const publishedAt = item.datePublished ? new Date(item.datePublished) : null;

        const description = item.description?.trim() || null;
        const prepTime = parseDuration(item.prepTime);
        const cookTime = parseDuration(item.cookTime);
        const servings = parseServings(item.recipeYield);
        const ingredients = item.recipeIngredient?.filter((i) => i.trim()) ?? [];
        const instructions = extractInstructions(item.recipeInstructions);

        results.push({
          sourceUrl: item.url || sourceUrl,
          sourceSite,
          title,
          description,
          ratingValue: ratingValue && !isNaN(ratingValue) ? ratingValue : null,
          ratingCount: ratingCount && !isNaN(ratingCount) ? ratingCount : null,
          reviewCount: reviewCount && !isNaN(reviewCount) ? reviewCount : null,
          prepTime,
          cookTime,
          servings,
          categories,
          seasonalTags,
          ingredients,
          instructions,
          publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
        });
      }
    } catch {
      // Skip malformed JSON-LD blocks
    }
  });

  return results;
}

const SEASONAL_KEYWORDS: Record<string, string[]> = {
  spring: ["spring", "easter", "march", "april", "may"],
  summer: ["summer", "bbq", "barbecue", "grilling", "june", "july", "august", "picnic"],
  autumn: ["autumn", "fall", "halloween", "thanksgiving", "september", "october", "november", "harvest"],
  winter: ["winter", "christmas", "holiday", "festive", "december", "january", "february", "new year"],
};

function extractSeasonalTags(keywords: string[]): string[] {
  const tags = new Set<string>();
  const combined = keywords.join(" ").toLowerCase();
  for (const [season, terms] of Object.entries(SEASONAL_KEYWORDS)) {
    if (terms.some((term) => combined.includes(term))) {
      tags.add(season);
    }
  }
  return [...tags];
}

export function extractLinksFromSitemap(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export function extractLinksFromHtml(html: string, baseUrl: string, linkSelector: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const origin = new URL(baseUrl).origin;

  $(linkSelector).each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        const url = new URL(href, origin);
        urls.push(url.href);
      } catch {
        // skip invalid URLs
      }
    }
  });

  return [...new Set(urls)];
}
