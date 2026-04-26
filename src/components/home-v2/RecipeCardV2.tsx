import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { RecipeCardData } from "@/types/recipe";
import { SavedIndicator } from "@/components/recipe/SavedIndicator";

interface Props {
  recipe: RecipeCardData;
  size?: "sm" | "md";
}

export function RecipeCardV2({ recipe, size = "md" }: Props) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const imgHeight = size === "sm" ? "h-44" : "h-56";

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200 transition-all duration-200 hover:ring-2 hover:ring-orange-500 hover:shadow-lg"
    >
      <div className={`relative ${imgHeight} w-full overflow-hidden`}>
        <Image
          src={recipe.heroImage}
          alt={recipe.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={recipe.heroImage.startsWith("/")}
        />
        <SavedIndicator recipeId={recipe.id} />
        {recipe.ratingAverage !== undefined && recipe.ratingAverage > 0 && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-neutral-700 shadow-sm">
            <span className="text-orange-500">★</span>
            <span>{recipe.ratingAverage.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-neutral-700 transition-colors group-hover:text-orange-600">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDuration(totalTime)}</span>
          {recipe.categories.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{recipe.categories[0].category.name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
