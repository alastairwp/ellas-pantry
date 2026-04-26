import {
  getFeaturedRecipes,
  getQuickRecipes,
  getLatestRecipes,
  getTopRatedRecipes,
} from "@/lib/recipes";
import { getCategories } from "@/lib/categories";
// import { AdUnit } from "@/components/ads/AdUnit"; // Re-enable after AdSense approval
import { HomeHeroV2 } from "@/components/home-v2/HomeHeroV2";
import { CategoryChipStrip } from "@/components/home-v2/CategoryChipStrip";
import { FeaturedCollage } from "@/components/home-v2/FeaturedCollage";
import { FeaturesSection } from "@/components/home-v2/FeaturesSection";
import { RecipeRail } from "@/components/home-v2/RecipeRail";
import { CuisineTiles } from "@/components/home-v2/CuisineTiles";
import { EditorialPromo } from "@/components/home-v2/EditorialPromo";
import { NewsletterStrip } from "@/components/home-v2/NewsletterStrip";
import { AllergyProfileBanner } from "@/components/banners/AllergyProfileBanner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, quick, latest, topRated, categories] = await Promise.all([
    getFeaturedRecipes(13),
    getQuickRecipes(8),
    getLatestRecipes(8),
    getTopRatedRecipes(8),
    getCategories(),
  ]);

  const featuredCollage = featured.slice(0, 5);
  const trending = featured.slice(5, 13);
  const heroImages = featured.slice(0, 4).map((r) => r.heroImage);
  const trimmedCategories = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div className="bg-white">
      <HomeHeroV2 collageImages={heroImages} />
      <CategoryChipStrip categories={trimmedCategories} />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <AllergyProfileBanner />
      </div>
      <FeaturesSection />
      <FeaturedCollage recipes={featuredCollage} />

      {/* Ad slot 1 — hidden until AdSense approval
      <div className="mx-auto max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
        <AdUnit adSlot="home-top" adFormat="horizontal" />
      </div>
      */}

      <RecipeRail
        title="Trending now"
        subtitle="Popular this week"
        recipes={trending}
        href="/recipes"
      />
      <RecipeRail
        title="Quick & easy"
        subtitle="30 minutes or less"
        recipes={quick}
        href="/recipes?sort=quickest"
      />

      <CuisineTiles categories={trimmedCategories} />

      {/* Ad slot 2 — hidden until AdSense approval
      <div className="mx-auto flex max-w-3xl justify-center px-4 py-2 sm:px-6 lg:px-8">
        <AdUnit adSlot="home-mid" adFormat="rectangle" />
      </div>
      */}

      <RecipeRail
        title="Fresh out of the oven"
        subtitle="Latest additions"
        recipes={latest}
        href="/recipes?sort=newest"
        accent="zinc"
      />

      <EditorialPromo />

      <RecipeRail
        title="Reader favourites"
        subtitle="Top-rated dishes"
        recipes={topRated}
        href="/recipes?sort=rating"
      />

      {/* Ad slot 3 — hidden until AdSense approval
      <div className="mx-auto max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
        <AdUnit adSlot="home-bottom" adFormat="horizontal" />
      </div>
      */}

      <NewsletterStrip />
    </div>
  );
}
