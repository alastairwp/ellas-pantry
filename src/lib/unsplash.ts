const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const STOCK_IMAGES_ENABLED = process.env.STOCK_IMAGES_ENABLED !== "false";

/**
 * Find a royalty-free food photo for a dish name.
 * Tries Unsplash first, then Pexels as fallback, then placeholder.
 * Set STOCK_IMAGES_ENABLED=false in .env to skip stock image lookups.
 */
export async function findRecipeImage(dishName: string): Promise<string> {
  if (STOCK_IMAGES_ENABLED) {
    // Try Unsplash first
    if (UNSPLASH_ACCESS_KEY) {
      const url = await searchUnsplash(dishName);
      if (url) return url;
    }

    // Try Pexels as fallback
    if (PEXELS_API_KEY) {
      const url = await searchPexels(dishName);
      if (url) return url;
    }
  }

  return generatePlaceholder(dishName);
}

async function searchUnsplash(dishName: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${dishName} food dish`);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      }
    );

    if (!res.ok) {
      console.warn(`Unsplash API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const photo = data.results?.[0];

    if (photo?.urls?.regular) {
      return photo.urls.regular;
    }

    // Broader search fallback
    const simpleQuery = encodeURIComponent(
      dishName.split(" ").slice(0, 2).join(" ") + " food"
    );
    const retry = await fetch(
      `https://api.unsplash.com/search/photos?query=${simpleQuery}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      }
    );
    const retryData = await retry.json();
    if (retryData.results?.[0]?.urls?.regular) {
      return retryData.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.warn("Unsplash fetch failed:", error);
    return null;
  }
}

async function searchPexels(dishName: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${dishName} food`);
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: PEXELS_API_KEY! },
      }
    );

    if (!res.ok) {
      console.warn(`Pexels API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const photo = data.photos?.[0];

    if (photo?.src?.large2x) {
      return photo.src.large2x;
    }

    // Broader search fallback
    const simpleQuery = encodeURIComponent(
      dishName.split(" ").slice(0, 2).join(" ") + " food"
    );
    const retry = await fetch(
      `https://api.pexels.com/v1/search?query=${simpleQuery}&per_page=1&orientation=portrait`,
      {
        headers: { Authorization: PEXELS_API_KEY! },
      }
    );
    const retryData = await retry.json();
    if (retryData.photos?.[0]?.src?.large2x) {
      return retryData.photos[0].src.large2x;
    }

    return null;
  } catch (error) {
    console.warn("Pexels fetch failed:", error);
    return null;
  }
}

/**
 * Find a recipe image from a specific source.
 */
export async function findRecipeImageFromSource(
  dishName: string,
  source: "unsplash" | "pexels"
): Promise<string | null> {
  if (source === "unsplash" && UNSPLASH_ACCESS_KEY) {
    return searchUnsplash(dishName);
  }
  if (source === "pexels" && PEXELS_API_KEY) {
    return searchPexels(dishName);
  }
  return null;
}

function generatePlaceholder(dishName: string): string {
  const encoded = encodeURIComponent(dishName);
  return `https://placehold.co/1200x1800/f59e0b/ffffff?text=${encoded}`;
}
