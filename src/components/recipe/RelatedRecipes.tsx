import { getRelatedRecipes } from "@/lib/recipes";
import { RecipeCard } from "./RecipeCard";

interface RelatedRecipesProps {
  slug: string;
  categoryIds: number[];
  dietaryTagIds: number[];
}

export async function RelatedRecipes({
  slug,
  categoryIds,
  dietaryTagIds,
}: RelatedRecipesProps) {
  const recipes = await getRelatedRecipes(slug, categoryIds, dietaryTagIds);

  if (recipes.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-neutral-900">
        You Might Also Like
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.slug} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}
