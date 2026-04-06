import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RecipeRow {
  id: number;
  slug: string;
  title: string;
  source: string;
  heroImage: string | null;
  description: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
  createdAt: Date;
  ingredientNames: string[];
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "with", "in", "of", "for", "to", "on", "by",
  "its", "my", "her", "his", "our", "your", "ii", "iii", "iv", "v",
  "recipe", "style", "homemade", "easy", "best", "simple", "quick",
]);

function titleWords(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return new Set(words);
}

// Extract core food words from ingredient strings like "4 cups cubed seeded watermelon"
// CSV-imported recipes store full lines; AI-generated ones store just the name
const INGREDIENT_STOP_WORDS = new Set([
  // quantities & units
  "cup", "cups", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
  "ounce", "ounces", "pound", "pounds", "gram", "grams", "kg", "ml",
  "inch", "pinch", "dash", "can", "cans", "package", "container", "jar",
  "large", "small", "medium", "optional",
  // prep methods
  "chopped", "diced", "sliced", "minced", "crushed", "grated", "peeled",
  "cored", "pitted", "halved", "quartered", "cubed", "shredded", "torn",
  "melted", "softened", "sifted", "drained", "seeded", "seedless",
  "fresh", "frozen", "dried", "ground", "packed", "divided",
  "cut", "into", "cubes", "pieces", "bite", "size", "thin", "thick",
  "finely", "roughly", "thinly", "juiced", "zested", "trimmed",
  // colors/descriptors that vary between recipes
  "white", "black", "red", "green", "yellow", "dark", "light",
  // filler
  "to", "taste", "or", "and", "as", "needed", "such", "about", "preferred",
]);

function simplePlural(word: string): string {
  // Normalize common plurals to singular
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ches") || word.endsWith("shes")) return word.slice(0, -2);
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 5) return word.slice(0, -1);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

function normalizeIngredient(name: string): string {
  let s = name.toLowerCase();
  // Strip everything after comma (prep notes like "diced", "cut into cubes")
  const commaIdx = s.indexOf(",");
  if (commaIdx > 0) s = s.slice(0, commaIdx);
  // Remove parenthetical notes
  s = s.replace(/\([^)]*\)/g, "");
  // Strip numbers, fractions, punctuation
  s = s.replace(/[^a-z\s]/g, " ");
  // Split into words, remove stop words, normalize plurals
  const words = s
    .split(/\s+/)
    .map(simplePlural)
    .filter((w) => w.length > 2 && !INGREDIENT_STOP_WORDS.has(w));
  return words.join(" ") || name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
}

function normalizeIngredientSet(ingredients: string[]): Set<string> {
  const normalized = new Set<string>();
  for (const ing of ingredients) {
    const n = normalizeIngredient(ing);
    if (n) normalized.add(n);
  }
  return normalized;
}

// Extract individual food words for a looser word-level comparison
function ingredientWordSet(ingredients: string[]): Set<string> {
  const words = new Set<string>();
  for (const ing of ingredients) {
    const n = normalizeIngredient(ing);
    for (const w of n.split(/\s+/)) {
      if (w.length > 2) words.add(w);
    }
  }
  return words;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function setIntersection(a: Set<string>, b: Set<string>): string[] {
  const result: string[] = [];
  for (const item of a) {
    if (b.has(item)) result.push(item);
  }
  return result.sort();
}

export async function GET(request: NextRequest) {
  const threshold = parseFloat(
    request.nextUrl.searchParams.get("threshold") || "0.6"
  );

  // Fetch all recipes with ingredient arrays in a single query
  const rows = await prisma.$queryRaw<
    {
      id: number;
      slug: string;
      title: string;
      source: string;
      heroImage: string | null;
      description: string | null;
      prepTime: number;
      cookTime: number;
      servings: number;
      createdAt: Date;
      ingredient_names: string[] | null;
    }[]
  >`
    SELECT r.id, r.slug, r.title, r.source, r."heroImage", r.description,
           r."prepTime", r."cookTime", r.servings, r."createdAt",
           array_agg(i.name ORDER BY i.name) FILTER (WHERE i.name IS NOT NULL) as ingredient_names
    FROM "Recipe" r
    LEFT JOIN "RecipeIngredient" ri ON ri."recipeId" = r.id
    LEFT JOIN "Ingredient" i ON i.id = ri."ingredientId"
    WHERE r.published = true
    GROUP BY r.id
  `;

  const recipes: RecipeRow[] = rows.map((r) => ({
    ...r,
    ingredientNames: r.ingredient_names || [],
  }));

  // Pre-compute title word sets and ingredient sets (both raw and normalized)
  const titleSets = new Map<number, Set<string>>();
  const ingredientSets = new Map<number, Set<string>>();
  const normalizedIngSets = new Map<number, Set<string>>();
  const ingWordSets = new Map<number, Set<string>>();
  for (const r of recipes) {
    titleSets.set(r.id, titleWords(r.title));
    ingredientSets.set(r.id, new Set(r.ingredientNames));
    normalizedIngSets.set(r.id, normalizeIngredientSet(r.ingredientNames));
    ingWordSets.set(r.id, ingredientWordSet(r.ingredientNames));
  }

  // Build inverted index on normalized ingredients for pre-filtering
  const ingredientIndex = new Map<string, Set<number>>();
  for (const r of recipes) {
    const normSet = normalizedIngSets.get(r.id)!;
    for (const ing of normSet) {
      let set = ingredientIndex.get(ing);
      if (!set) {
        set = new Set();
        ingredientIndex.set(ing, set);
      }
      set.add(r.id);
    }
  }

  // Find candidate pairs (share at least 1 non-ubiquitous ingredient)
  // Skip ingredients used in >5% of recipes to avoid combinatorial explosion
  const maxFrequency = Math.max(recipes.length * 0.05, 50);
  const candidatePairs = new Set<string>();
  for (const [, recipeIds] of ingredientIndex) {
    if (recipeIds.size > maxFrequency) continue;
    const ids = [...recipeIds];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = Math.min(ids[i], ids[j]);
        const b = Math.max(ids[i], ids[j]);
        candidatePairs.add(`${a}:${b}`);
      }
    }
  }

  // Also check title-similar pairs (share at least one significant word)
  // Skip very common words (>5% of recipes) to avoid explosion
  const wordIndex = new Map<string, Set<number>>();
  for (const r of recipes) {
    const words = titleSets.get(r.id)!;
    for (const w of words) {
      let set = wordIndex.get(w);
      if (!set) {
        set = new Set();
        wordIndex.set(w, set);
      }
      set.add(r.id);
    }
  }
  for (const [, recipeIds] of wordIndex) {
    if (recipeIds.size > maxFrequency) continue;
    const ids = [...recipeIds];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = Math.min(ids[i], ids[j]);
        const b = Math.max(ids[i], ids[j]);
        candidatePairs.add(`${a}:${b}`);
      }
    }
  }

  // Compute similarity for candidate pairs
  interface SimilarPair {
    idA: number;
    idB: number;
    titleSim: number;
    ingredientSim: number;
    score: number;
    shared: string[];
  }

  const similarPairs: SimilarPair[] = [];
  // Build a set of exact-duplicate title pairs to exclude
  const exactTitlePairs = new Set<string>();
  const titleMap = new Map<string, number[]>();
  for (const r of recipes) {
    const key = `${r.title}::${r.source}`;
    const list = titleMap.get(key) || [];
    list.push(r.id);
    titleMap.set(key, list);
  }
  for (const [, ids] of titleMap) {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = Math.min(ids[i], ids[j]);
          const b = Math.max(ids[i], ids[j]);
          exactTitlePairs.add(`${a}:${b}`);
        }
      }
    }
  }

  for (const pairKey of candidatePairs) {
    // Skip exact duplicates (handled by the other endpoint)
    if (exactTitlePairs.has(pairKey)) continue;

    const [aStr, bStr] = pairKey.split(":");
    const idA = parseInt(aStr, 10);
    const idB = parseInt(bStr, 10);

    const titleSim = jaccard(titleSets.get(idA)!, titleSets.get(idB)!);
    // Use normalized ingredient names for comparison (handles CSV full-line ingredients)
    // Take the max of phrase-level and word-level Jaccard for better fuzzy matching
    const phraseSim = jaccard(normalizedIngSets.get(idA)!, normalizedIngSets.get(idB)!);
    const wordSim = jaccard(ingWordSets.get(idA)!, ingWordSets.get(idB)!);
    const ingredientSim = Math.max(phraseSim, wordSim);
    const score = 0.3 * titleSim + 0.7 * ingredientSim;

    // Check if one title's words are a subset of the other's (catches "Fruit Salad" inside "Fruit Salad with Dressing")
    const titleA = titleSets.get(idA)!;
    const titleB = titleSets.get(idB)!;
    const smaller = titleA.size <= titleB.size ? titleA : titleB;
    const larger = titleA.size <= titleB.size ? titleB : titleA;
    let subsetCount = 0;
    for (const w of smaller) if (larger.has(w)) subsetCount++;
    const titleContainment = smaller.size > 0 ? subsetCount / smaller.size : 0;

    const isSimilar =
      score >= threshold ||
      ingredientSim >= 0.8 ||
      (titleSim >= 0.9 && ingredientSim >= 0.15) ||
      (titleContainment >= 0.9 && ingredientSim >= 0.15);

    if (isSimilar) {
      const shared = setIntersection(normalizedIngSets.get(idA)!, normalizedIngSets.get(idB)!);
      similarPairs.push({ idA, idB, titleSim, ingredientSim, score, shared });
    }
  }

  // Union-Find to group connected recipes
  const parent = new Map<number, number>();
  function find(x: number): number {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  }
  function union(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const pair of similarPairs) {
    union(pair.idA, pair.idB);
  }

  // Group pairs by their root
  const groupMap = new Map<number, { recipeIds: Set<number>; bestPair: SimilarPair }>();
  for (const pair of similarPairs) {
    const root = find(pair.idA);
    const existing = groupMap.get(root);
    if (existing) {
      existing.recipeIds.add(pair.idA);
      existing.recipeIds.add(pair.idB);
      if (pair.score > existing.bestPair.score) {
        existing.bestPair = pair;
      }
    } else {
      groupMap.set(root, {
        recipeIds: new Set([pair.idA, pair.idB]),
        bestPair: pair,
      });
    }
  }

  // Build recipe lookup
  const recipeMap = new Map<number, RecipeRow>();
  for (const r of recipes) {
    recipeMap.set(r.id, r);
  }

  // Build response groups (skip groups that chained too many loosely-related recipes)
  const maxGroupSize = 6;
  const maxResults = 200;
  const groups = [...groupMap.values()]
    .filter((g) => g.recipeIds.size <= maxGroupSize)
    .sort((a, b) => b.bestPair.score - a.bestPair.score)
    .slice(0, maxResults)
    .map((g) => {
      const groupRecipes = [...g.recipeIds]
        .map((id) => recipeMap.get(id)!)
        .filter(Boolean)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        confidence: Math.round(g.bestPair.score * 100),
        titleSimilarity: Math.round(g.bestPair.titleSim * 100),
        ingredientSimilarity: Math.round(g.bestPair.ingredientSim * 100),
        sharedIngredients: g.bestPair.shared,
        recipes: groupRecipes.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          source: r.source,
          heroImage: r.heroImage || "",
          description: r.description || "",
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          servings: r.servings,
          createdAt: r.createdAt,
          ingredients: r.ingredientNames,
        })),
      };
    });

  return NextResponse.json({
    totalGroups: groups.length,
    totalSimilar: groups.reduce((sum, g) => sum + g.recipes.length - 1, 0),
    groups,
  });
}
