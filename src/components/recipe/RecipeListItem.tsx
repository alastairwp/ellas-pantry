import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { DietaryBadges } from "./DietaryBadges";
import { StarRating } from "./StarRating";
import type { RecipeCardData } from "@/types/recipe";
import { SavedIndicator } from "./SavedIndicator";

interface RecipeListItemProps {
  recipe: RecipeCardData;
}

export function RecipeListItem({ recipe }: RecipeListItemProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex items-center gap-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden p-3"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden">
        <Image
          src={recipe.heroImage}
          alt={recipe.title}
          fill
          sizes="80px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized={recipe.heroImage.startsWith("/")}
        />
        <SavedIndicator recipeId={recipe.id} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-neutral-800 group-hover:text-orange-700 transition-colors line-clamp-1">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">
            {recipe.description}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {recipe.ratingAverage !== undefined && recipe.ratingAverage > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={recipe.ratingAverage} count={recipe.ratingCount || 0} size="sm" />
              <span className="text-xs font-medium text-neutral-600">{recipe.ratingAverage.toFixed(1)}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs">{formatDuration(totalTime)}</span>
          </div>

          <DietaryBadges tags={recipe.dietaryTags.map((dt) => dt.dietaryTag)} />
        </div>
      </div>
    </Link>
  );
}
