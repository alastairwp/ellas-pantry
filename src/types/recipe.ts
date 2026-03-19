import type {
  Recipe,
  Ingredient,
  RecipeIngredient,
  RecipeStep,
  DietaryTag,
  Category,
} from "@prisma/client";

export type RecipeIngredientWithDetails = RecipeIngredient & {
  ingredient: Ingredient;
};

export type RecipeWithDetails = Recipe & {
  ingredients: RecipeIngredientWithDetails[];
  steps: RecipeStep[];
  dietaryTags: { dietaryTag: DietaryTag }[];
  categories: { category: Category }[];
};

export type RecipeCardData = Pick<
  Recipe,
  "id" | "slug" | "title" | "description" | "heroImage" | "prepTime" | "cookTime"
> & {
  dietaryTags: { dietaryTag: Pick<DietaryTag, "name" | "slug"> }[];
  categories: { category: Pick<Category, "name" | "slug"> }[];
  ratingAverage?: number;
  ratingCount?: number;
};

export interface RecipeFilters {
  query?: string;
  dietary?: string[];
  category?: string;
  occasion?: string;
  difficulty?: string;
  maxCookTime?: number;
  ingredient?: string;
  sort?: string;
  page?: number;
  limit?: number;
  excludeAllergens?: string[];
}
