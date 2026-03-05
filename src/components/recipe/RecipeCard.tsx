import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { DietaryBadges } from "./DietaryBadges";
import { StarRating } from "./StarRating";
import type { RecipeCardData } from "@/types/recipe";
import { SavedIndicator } from "./SavedIndicator";

interface RecipeCardProps {
  recipe: RecipeCardData;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Hero image */}
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src={recipe.heroImage}
          alt={recipe.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized={recipe.heroImage.startsWith("/")}
        />
        <SavedIndicator recipeId={recipe.id} />
      </div>

      {/* Card content */}
      <div className="p-4 flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-stone-800 group-hover:text-amber-700 transition-colors line-clamp-1">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="text-sm text-stone-500 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {recipe.ratingAverage !== undefined && recipe.ratingAverage > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={recipe.ratingAverage} count={recipe.ratingCount || 0} size="sm" />
            <span className="text-xs font-medium text-stone-600">{recipe.ratingAverage.toFixed(1)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          <Clock className="h-4 w-4 text-stone-400" />
          <span>{formatDuration(totalTime)}</span>
        </div>

        <DietaryBadges
          tags={recipe.dietaryTags.map((dt) => dt.dietaryTag)}
        />
      </div>
    </Link>
  );
}
