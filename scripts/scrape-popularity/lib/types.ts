export interface ScrapedRecipeSignal {
  sourceUrl: string;
  sourceSite: string;
  title: string;
  description: string | null;
  ratingValue: number | null;
  ratingCount: number | null;
  reviewCount: number | null;
  prepTime: number | null; // minutes
  cookTime: number | null; // minutes
  servings: number | null;
  categories: string[];
  seasonalTags: string[];
  ingredients: string[]; // raw recipeIngredient strings
  instructions: string[]; // step text from recipeInstructions
  publishedAt: Date | null;
}

export interface Scraper {
  name: string;
  sourceSite: string;
  scrape(fetcher: Fetcher): Promise<ScrapedRecipeSignal[]>;
}

export interface Fetcher {
  fetch(url: string): Promise<string | null>;
  isAllowed(url: string): Promise<boolean>;
}
