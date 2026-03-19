// Keyword groups and the dietary tags they contradict
export const MEAT_KEYWORDS = [
  "chicken",
  "beef",
  "pork",
  "lamb",
  "turkey",
  "bacon",
  "sausage",
  "ham",
  "steak",
  "mince",
  "ground beef",
  "ground turkey",
  "veal",
  "duck",
  "prosciutto",
  "salami",
  "pepperoni",
  "anchov",
  "shrimp",
  "prawn",
  "salmon",
  "tuna",
  "cod",
  "fish",
  "crab",
  "lobster",
  "clam",
  "mussel",
  "oyster",
  "scallop",
  "squid",
  "calamari",
  "gelatin",
  "gelatine",
  "lard",
  "suet",
  "bone broth",
  "fish sauce",
  "oyster sauce",
];

export const DAIRY_KEYWORDS = [
  "milk",
  "butter",
  "cream",
  "cheese",
  "yogurt",
  "yoghurt",
  "sour cream",
  "cream cheese",
  "whipping cream",
  "heavy cream",
  "half-and-half",
  "buttermilk",
  "ghee",
  "whey",
  "casein",
  "paneer",
  "mascarpone",
  "condensed milk",
  "creme fraiche",
  "crème fraîche",
];

export const EGG_KEYWORDS = ["egg"];

export const HONEY_KEYWORDS = ["honey"];

export const GLUTEN_KEYWORDS = [
  "flour",
  "bread",
  "pasta",
  "noodle",
  "wheat",
  "cracker",
  "crumb",
  "tortilla",
  "puff pastry",
  "pie crust",
  "pie pastry",
  "biscuit",
  "cake mix",
  "brownie mix",
  "soy sauce",
  "barley",
  "rye",
  "spelt",
  "semolina",
  "couscous",
  "seitan",
  "panko",
  "naan",
];

export const NUT_KEYWORDS = [
  "almond",
  "walnut",
  "pecan",
  "cashew",
  "pistachio",
  "peanut",
  "hazelnut",
  "macadamia",
  "brazil nut",
  "pine nut",
  "marzipan",
  "praline",
];

// Plant-based prefixes that make dairy keywords false positives
const PLANT_DAIRY_EXEMPTIONS = [
  "coconut milk",
  "oat milk",
  "soy milk",
  "almond milk",
  "rice milk",
  "cashew milk",
  "hemp milk",
  "peanut butter",
  "almond butter",
  "cashew butter",
  "cocoa butter",
  "shea butter",
  "sunflower butter",
  "coconut cream",
  "cream of tartar",
  "coconut yogurt",
  "coconut yoghurt",
  "soy yogurt",
  "soy yoghurt",
  "vegan cheese",
  "nutritional yeast",
  "coconut butter",
  "ice cream bean",
];

/**
 * Check if an ingredient string triggers a dairy keyword match,
 * accounting for plant-based exemptions.
 */
function ingredientMatchesDairy(ingredient: string): boolean {
  const lower = ingredient.toLowerCase();
  // Check if any exemption applies first
  for (const exemption of PLANT_DAIRY_EXEMPTIONS) {
    if (lower.includes(exemption)) return false;
  }
  return DAIRY_KEYWORDS.some((k) => lower.includes(k));
}

/**
 * Safety-net filter: removes dietary tag slugs that contradict the given ingredients.
 * Never adds tags — only removes invalid ones.
 */
export function filterInvalidDietaryTags(
  ingredientNames: string[],
  tagSlugs: string[]
): string[] {
  const tagsToRemove = new Set<string>();

  for (const name of ingredientNames) {
    const lower = name.toLowerCase();

    // Meat check → contradicts vegan, vegetarian
    if (MEAT_KEYWORDS.some((k) => lower.includes(k))) {
      tagsToRemove.add("vegan");
      tagsToRemove.add("vegetarian");
    }

    // Dairy check (with plant exemptions) → contradicts vegan, dairy-free
    if (ingredientMatchesDairy(lower)) {
      tagsToRemove.add("vegan");
      tagsToRemove.add("dairy-free");
    }

    // Egg check → contradicts vegan, egg-free
    if (EGG_KEYWORDS.some((k) => new RegExp(`\\b${k}s?\\b`).test(lower))) {
      tagsToRemove.add("vegan");
      tagsToRemove.add("egg-free");
    }

    // Honey check → contradicts vegan
    if (HONEY_KEYWORDS.some((k) => lower.includes(k))) {
      tagsToRemove.add("vegan");
    }

    // Gluten check → contradicts gluten-free
    if (GLUTEN_KEYWORDS.some((k) => lower.includes(k))) {
      tagsToRemove.add("gluten-free");
    }

    // Nut check → contradicts nut-free
    if (NUT_KEYWORDS.some((k) => lower.includes(k))) {
      tagsToRemove.add("nut-free");
    }
  }

  return tagSlugs.filter((slug) => !tagsToRemove.has(slug));
}

/**
 * ID-based wrapper: resolves tag IDs to slugs, filters, returns valid IDs.
 */
export async function filterInvalidDietaryTagIds(
  ingredientNames: string[],
  tagIds: number[]
): Promise<number[]> {
  if (tagIds.length === 0) return [];

  // Lazy import to avoid creating a PrismaClient when only slug-based
  // functions are used (e.g. from seed.ts or standalone scripts)
  const { prisma } = await import("./prisma");

  const tags = await prisma.dietaryTag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, slug: true },
  });

  const slugToId = new Map(tags.map((t) => [t.slug, t.id]));
  const allSlugs = tags.map((t) => t.slug);

  const validSlugs = filterInvalidDietaryTags(ingredientNames, allSlugs);
  return validSlugs.map((slug) => slugToId.get(slug)!).filter(Boolean);
}
