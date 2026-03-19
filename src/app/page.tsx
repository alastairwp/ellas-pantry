import Link from "next/link";
import Image from "next/image";
import { getFeaturedRecipes, getRecipeOfTheDay } from "@/lib/recipes";
import { getCategories } from "@/lib/categories";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { AllergyProfileBanner } from "@/components/banners/AllergyProfileBanner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recipes, categories, recipeOfTheDay] = await Promise.all([
    getFeaturedRecipes(6),
    getCategories(),
    getRecipeOfTheDay(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-16 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Delicious Recipes for Every Occasion
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            Browse our collection of tried-and-tested recipes with clear
            instructions, ingredient lists, and helpful tips.
          </p>
          <Link
            href="/recipes"
            className="mt-6 inline-block rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            Browse All Recipes
          </Link>
        </div>
      </section>

      {/* Allergy Profile Banner */}
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <AllergyProfileBanner />
      </div>

      {/* Recipe of the Day */}
      {recipeOfTheDay && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-6">
            Recipe of the Day
          </h2>
          <Link
            href={`/recipes/${recipeOfTheDay.slug}`}
            className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row">
              {recipeOfTheDay.heroImage && (
                <div className="relative sm:w-1/2 aspect-[16/9] sm:aspect-auto sm:min-h-[280px]">
                  <Image
                    src={recipeOfTheDay.heroImage}
                    alt={recipeOfTheDay.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center p-6 sm:p-8 sm:w-1/2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
                  Today&apos;s Pick
                </span>
                <h3 className="text-2xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                  {recipeOfTheDay.title}
                </h3>
                {recipeOfTheDay.description && (
                  <p className="mt-2 text-stone-600 line-clamp-3">
                    {recipeOfTheDay.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-stone-500">
                  {recipeOfTheDay.prepTime && (
                    <span>Prep: {recipeOfTheDay.prepTime} min</span>
                  )}
                  {recipeOfTheDay.cookTime && (
                    <span>Cook: {recipeOfTheDay.cookTime} min</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Featured Recipes */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-stone-900">Latest Recipes</h2>
          <Link
            href="/recipes"
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-stone-900 mb-8">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-6 text-center transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
              >
                <span className="text-lg font-semibold text-stone-800 group-hover:text-amber-700">
                  {category.name}
                </span>
                {category.description && (
                  <span className="mt-1 text-sm text-stone-500">
                    {category.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
