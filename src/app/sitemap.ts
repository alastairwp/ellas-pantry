import type { MetadataRoute } from "next";
import { getAllRecipeSlugs } from "@/lib/recipes";
import { getAllCategorySlugs } from "@/lib/categories";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ellaspantry.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let recipes: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];

  try {
    [recipes, categories] = await Promise.all([
      getAllRecipeSlugs(),
      getAllCategorySlugs(),
    ]);
  } catch {
    // Database unavailable during build
  }

  const recipeUrls = recipes.map((r) => ({
    url: `${BASE_URL}/recipes/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE_URL}/recipes`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...recipeUrls,
    ...categoryUrls,
  ];
}
