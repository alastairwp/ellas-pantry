import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getRecipes } from "@/lib/recipes";
import { getCategoryBySlug } from "@/lib/categories";
import { ShowMoreRecipes } from "@/components/recipe/ShowMoreRecipes";
import { categoryContent } from "@/lib/category-content";
import {
  Shield,
  Timer,
  Lightbulb,
  BarChart3,
  Camera,
  Star,
  ArrowRight,
} from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  const content = categoryContent[slug];

  return {
    title: `${category.name} Recipes | Ella's Pantry`,
    description:
      content?.metaDescription ||
      `Browse our collection of ${category.name.toLowerCase()} recipes with allergy filters, nutritional info, and step-by-step instructions.`,
    openGraph: {
      title: `${category.name} Recipes | Ella's Pantry`,
      description:
        content?.metaDescription ||
        `Browse our collection of ${category.name.toLowerCase()} recipes.`,
      type: "website",
    },
  };
}

const features = [
  {
    icon: Shield,
    title: "Allergy Filters",
    description:
      "Set your allergies once and filter every recipe to see only what's safe for you.",
  },
  {
    icon: Timer,
    title: "Built-in Timers",
    description:
      "Start timers right from the recipe page — never overcook or underbake again.",
  },
  {
    icon: Lightbulb,
    title: "Hints & Tips",
    description:
      "Chef's tips on every recipe share the tricks that make each dish special.",
  },
  {
    icon: BarChart3,
    title: "Nutritional Info",
    description:
      "Calories, protein, carbs, fat, fibre, and sugar — for every recipe.",
  },
  {
    icon: Camera,
    title: "My Fridge",
    description:
      "Photograph your fridge and find recipes you can make with what you have.",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description:
      "Rate recipes and read what others think to find the very best dishes.",
  },
];

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const content = categoryContent[slug];
  const { recipes, total, totalPages } = await getRecipes({
    category: slug,
    limit: 36,
  });

  return (
    <div>
      {/* Hero Section */}
      {content && (
        <div className="bg-gradient-to-b from-amber-50 to-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center">
            <h1 className="text-4xl font-bold text-stone-900 sm:text-5xl">
              {content.heroTitle}
            </h1>
            <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
              {content.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={`/recipes?category=${slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Browse with filters
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Introduction */}
      {content && (
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-lg text-stone-700 leading-relaxed">
            {content.intro}
          </p>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="recipes" className="text-2xl font-bold text-stone-900 scroll-mt-4">
              Latest {category.name} Recipes
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {total} recipe{total !== 1 ? "s" : ""} in this category
            </p>
          </div>
          <Link
            href={`/recipes?category=${slug}`}
            className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View all with filters
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ShowMoreRecipes
          initialRecipes={recipes}
          totalPages={totalPages}
          filterParam={`category=${slug}`}
          limit={36}
        />
      </div>

      {/* Feature Grid */}
      {content && (
        <div className="bg-stone-50 py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold text-stone-900 mb-8">
              Why cook with Ella&apos;s Pantry?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl bg-white border border-stone-200 p-5"
                >
                  <div className="inline-flex items-center justify-center rounded-lg bg-amber-50 p-2.5 text-amber-600 mb-3">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-stone-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {content && (
        <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-bold text-stone-900">
                {section.heading}
              </h2>
              <p className="mt-3 text-stone-700 leading-relaxed">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CTA Banner */}
      {content && (
        <div className="bg-amber-600 py-10">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold text-white">
              Ready to start cooking?
            </h2>
            <p className="mt-2 text-amber-100">
              Create a free account to save your allergies, bookmark favourites,
              rate recipes, and access personalised recommendations.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Sign up free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/recipes?category=${slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Browse recipes
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Ella Signature */}
      <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
        <p
          className="text-2xl text-amber-700"
          style={{ fontFamily: "cursive" }}
        >
          Ella x
        </p>
      </div>
    </div>
  );
}
