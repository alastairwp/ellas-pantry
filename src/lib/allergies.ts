export const ALLERGY_TYPES = ["eggs", "dairy", "nuts", "gluten"] as const;
export type AllergyType = (typeof ALLERGY_TYPES)[number];

export const ALLERGY_TO_DIETARY_TAG: Record<AllergyType, string> = {
  eggs: "egg-free",
  dairy: "dairy-free",
  gluten: "gluten-free",
  nuts: "nut-free",
};

export const ALLERGY_LABELS: Record<AllergyType, string> = {
  eggs: "Eggs",
  dairy: "Dairy",
  gluten: "Gluten",
  nuts: "Nuts",
};

export const ALLERGY_DESCRIPTIONS: Record<AllergyType, string> = {
  eggs: "Excludes recipes containing eggs or egg-based ingredients",
  dairy: "Excludes recipes containing milk, butter, cream, cheese, yogurt",
  nuts: "Excludes recipes containing almonds, walnuts, cashews, peanuts and other nuts",
  gluten: "Excludes recipes containing flour, bread, pasta, wheat and other gluten sources",
};
