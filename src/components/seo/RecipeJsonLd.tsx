interface JsonLdIngredient {
  quantity: string;
  unit: string | null;
  ingredient: {
    name: string;
  };
}

interface JsonLdStep {
  stepNumber: number;
  instruction: string;
}

interface JsonLdCategory {
  category: {
    name: string;
  };
}

interface JsonLdDietaryTag {
  dietaryTag: {
    name: string;
    slug: string;
  };
}

interface JsonLdOccasion {
  occasion: {
    name: string;
  };
}

interface RecipeJsonLdProps {
  title: string;
  description: string;
  heroImage: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: JsonLdIngredient[];
  steps: JsonLdStep[];
  categories: JsonLdCategory[];
  dietaryTags: JsonLdDietaryTag[];
  createdAt: Date | string;
  updatedAt: Date | string;
  ratingAverage?: number;
  ratingCount?: number;
  calories?: number | null;
  occasions?: JsonLdOccasion[];
}

const dietaryTagToSchemaOrg: Record<string, string> = {
  vegan: "https://schema.org/VeganDiet",
  vegetarian: "https://schema.org/VegetarianDiet",
  "gluten-free": "https://schema.org/GlutenFreeDiet",
  "dairy-free": "https://schema.org/DairyFreeDiet",
  "nut-free": "https://schema.org/NutFreeDiet",
};

function toIsoDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `PT${hours}H${mins}M`;
  if (hours > 0) return `PT${hours}H`;
  return `PT${mins}M`;
}

export function RecipeJsonLd({
  title,
  description,
  heroImage,
  prepTime,
  cookTime,
  servings,
  ingredients,
  steps,
  categories,
  dietaryTags,
  createdAt,
  updatedAt,
  ratingAverage,
  ratingCount,
  calories,
  occasions,
}: RecipeJsonLdProps) {
  const suitableForDiet = dietaryTags
    .map((dt) => dietaryTagToSchemaOrg[dt.dietaryTag.slug])
    .filter(Boolean);

  const fullImageUrl = heroImage.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.ellaspantry.co.uk"}${heroImage}`
    : heroImage;

  const keywords = occasions
    ?.map((o) => o.occasion.name)
    .filter(Boolean)
    .join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: title,
    description,
    image: [fullImageUrl],
    author: {
      "@type": "Organization",
      name: "Ella's Pantry",
      url: "https://www.ellaspantry.co.uk",
    },
    prepTime: toIsoDuration(prepTime),
    cookTime: toIsoDuration(cookTime),
    totalTime: toIsoDuration(prepTime + cookTime),
    recipeYield: `${servings} servings`,
    recipeCategory: categories.map((c) => c.category.name),
    ...(suitableForDiet.length > 0 && { suitableForDiet }),
    ...(keywords && { keywords }),
    recipeIngredient: ingredients.map((item) => {
      let text = item.quantity;
      if (item.unit) text += ` ${item.unit}`;
      text += ` ${item.ingredient.name}`;
      return text;
    }),
    recipeInstructions: steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      name:
        step.instruction.length > 50
          ? step.instruction.substring(0, 50).trimEnd() + "…"
          : step.instruction,
      text: step.instruction,
    })),
    datePublished: new Date(createdAt).toISOString(),
    dateModified: new Date(updatedAt).toISOString(),
    ...(calories != null && {
      nutrition: {
        "@type": "NutritionInformation",
        calories: `${calories} calories`,
      },
    }),
    ...(ratingCount && ratingAverage
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAverage,
            ratingCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
