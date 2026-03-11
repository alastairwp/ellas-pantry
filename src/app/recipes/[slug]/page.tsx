import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getRecipeBySlug } from "@/lib/recipes";
import { auth } from "@/lib/auth";
import { RecipeHero } from "@/components/recipe/RecipeHero";
import { RecipeMeta } from "@/components/recipe/RecipeMeta";
import { DietaryBadges } from "@/components/recipe/DietaryBadges";
import { ScalableIngredientsList } from "@/components/recipe/ScalableIngredientsList";
import { CookingSteps } from "@/components/recipe/CookingSteps";
import { ShareButton } from "@/components/recipe/ShareButton";
import { PrintButton } from "@/components/recipe/PrintButton";
import { PriceEstimate } from "@/components/recipe/PriceEstimate";
import { RecipeJsonLd } from "@/components/seo/RecipeJsonLd";
import { AdUnit } from "@/components/ads/AdUnit";
import { RecipeRating } from "@/components/recipe/RecipeRating";
import { AdminEditButton } from "@/components/recipe/AdminEditButton";
import { SaveRecipeButton } from "@/components/recipe/SaveRecipeButton";
import { CookModeButton } from "@/components/recipe/CookMode";
import { AddToMealPlan } from "@/components/recipe/AddToMealPlan";
import { NutritionPanel } from "@/components/recipe/NutritionPanel";
import { AddToCollectionButton } from "@/components/recipe/AddToCollectionButton";
import { RelatedRecipes } from "@/components/recipe/RelatedRecipes";
import { SubstitutionsPanel } from "@/components/recipe/SubstitutionsPanel";
import { RecipeImage } from "@/components/recipe/RecipeImage";

const ReviewSection = dynamic(
  () => import("@/components/recipe/ReviewSection").then((mod) => mod.ReviewSection),
);

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const recipe = await getRecipeBySlug(slug, isAdmin);
  if (!recipe) return { title: "Recipe Not Found" };

  return {
    title: recipe.title,
    description: recipe.description,
    openGraph: {
      title: recipe.title,
      description: recipe.description,
      images: [{ url: recipe.heroImage, width: 1200, height: 1800 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: recipe.description,
      images: [recipe.heroImage],
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const recipe = await getRecipeBySlug(slug, isAdmin);
  if (!recipe) notFound();

  const dietaryTags = recipe.dietaryTags.map((t) => t.dietaryTag);

  return (
    <article>
      {!recipe.published && (
        <div className="bg-amber-500 text-white text-center text-sm font-medium py-2 px-4">
          This recipe is pending review and not visible to the public.
        </div>
      )}
      <RecipeJsonLd
        title={recipe.title}
        description={recipe.description}
        heroImage={recipe.heroImage}
        prepTime={recipe.prepTime}
        cookTime={recipe.cookTime}
        servings={recipe.servings}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        categories={recipe.categories}
        dietaryTags={recipe.dietaryTags}
        createdAt={recipe.createdAt}
        updatedAt={recipe.updatedAt}
        ratingAverage={recipe.ratingAverage}
        ratingCount={recipe.ratingCount}
        calories={recipe.calories}
        occasions={recipe.occasions}
      />

      <RecipeHero
        title={recipe.title}
        heroImage={recipe.heroImage}
        prepTime={recipe.prepTime}
        cookTime={recipe.cookTime}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <RecipeMeta
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          servings={recipe.servings}
          difficulty={recipe.difficulty}
        />

        {dietaryTags.length > 0 && (
          <div className="mt-4">
            <DietaryBadges tags={dietaryTags} />
          </div>
        )}

        {/* Rating */}
        <div className="mt-6">
          <RecipeRating recipeId={recipe.id} />
        </div>

        {/* Action Bar + Image */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex flex-wrap gap-3 no-print flex-1">
            <CookModeButton title={recipe.title} steps={recipe.steps} />
            <SaveRecipeButton recipeId={recipe.id} />
            <AddToMealPlan recipeId={recipe.id} />
            <AddToCollectionButton recipeId={recipe.id} />
            <ShareButton title={recipe.title} description={recipe.description} recipeId={recipe.id} imageUrl={recipe.heroImage} />
            <PrintButton />
            <AdminEditButton recipeId={recipe.id} />
          </div>
          <div className="sm:flex-shrink-0">
            <RecipeImage src={recipe.heroImage} alt={recipe.title} />
          </div>
        </div>

        <AdUnit adSlot="recipe-top" adFormat="horizontal" className="my-6" />

        {/* Two Column Layout */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ScalableIngredientsList
              ingredients={recipe.ingredients}
              originalServings={recipe.servings}
            />
            <div className="mt-10">
              <CookingSteps steps={recipe.steps} />
            </div>
            <SubstitutionsPanel
              recipeId={recipe.id}
              dietaryTags={dietaryTags.map((t) => t.slug)}
            />
          </div>

          <aside className="no-print">
            <NutritionPanel
              calories={recipe.calories}
              protein={recipe.protein}
              carbs={recipe.carbs}
              fat={recipe.fat}
              fiber={recipe.fiber}
              sugar={recipe.sugar}
            />
            <PriceEstimate ingredients={recipe.ingredients} />
            <AdUnit
              adSlot="recipe-sidebar"
              adFormat="rectangle"
              className="mt-6"
            />
          </aside>
        </div>

        <RelatedRecipes
          slug={recipe.slug}
          categoryIds={recipe.categories.map((c) => c.category.id)}
          dietaryTagIds={recipe.dietaryTags.map((t) => t.dietaryTag.id)}
        />

        <ReviewSection recipeId={recipe.id} />

        <AdUnit adSlot="recipe-bottom" adFormat="horizontal" className="mt-8" />
      </div>
    </article>
  );
}
