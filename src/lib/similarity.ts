const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "with", "in", "of", "for", "to", "on", "by",
  "its", "my", "her", "his", "our", "your", "ii", "iii", "iv", "v",
  "recipe", "style", "homemade", "easy", "best", "simple", "quick",
]);

export function titleWords(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return new Set(words);
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

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
  // colors/descriptors
  "white", "black", "red", "green", "yellow", "dark", "light",
  // filler
  "to", "taste", "or", "and", "as", "needed", "such", "about", "preferred",
]);

export function simplePlural(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ches") || word.endsWith("shes")) return word.slice(0, -2);
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 5) return word.slice(0, -1);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function normalizeIngredient(name: string): string {
  let s = name.toLowerCase();
  const commaIdx = s.indexOf(",");
  if (commaIdx > 0) s = s.slice(0, commaIdx);
  s = s.replace(/\([^)]*\)/g, "");
  s = s.replace(/[^a-z\s]/g, " ");
  const words = s
    .split(/\s+/)
    .map(simplePlural)
    .filter((w) => w.length > 2 && !INGREDIENT_STOP_WORDS.has(w));
  return words.join(" ") || name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
}

export function normalizeIngredientSet(ingredients: string[]): Set<string> {
  const normalized = new Set<string>();
  for (const ing of ingredients) {
    const n = normalizeIngredient(ing);
    if (n) normalized.add(n);
  }
  return normalized;
}

export function ingredientWordSet(ingredients: string[]): Set<string> {
  const words = new Set<string>();
  for (const ing of ingredients) {
    const n = normalizeIngredient(ing);
    for (const w of n.split(/\s+/)) {
      if (w.length > 2) words.add(w);
    }
  }
  return words;
}

export function setIntersection(a: Set<string>, b: Set<string>): string[] {
  const result: string[] = [];
  for (const item of a) {
    if (b.has(item)) result.push(item);
  }
  return result.sort();
}
