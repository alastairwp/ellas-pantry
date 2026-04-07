import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  titleWords,
  jaccard,
  normalizeIngredientSet,
  ingredientWordSet,
  setIntersection,
} from "@/lib/similarity";

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
