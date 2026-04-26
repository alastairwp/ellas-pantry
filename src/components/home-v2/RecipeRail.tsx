import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RecipeCardV2 } from "./RecipeCardV2";
import type { RecipeCardData } from "@/types/recipe";

interface Props {
  title: string;
  subtitle?: string;
  recipes: RecipeCardData[];
  href?: string;
  accent?: "orange" | "zinc";
}

export function RecipeRail({
  title,
  subtitle,
  recipes,
  href,
  accent = "orange",
}: Props) {
  if (recipes.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              accent === "orange" ? "text-orange-600" : "text-neutral-500"
            }`}
          >
            {subtitle ?? "Recipes"}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-neutral-700 sm:text-3xl">
            {title}
          </h2>
        </div>
        {href && (
          <Link
            href={href}
            className="hidden items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {recipes.map((r) => (
          <RecipeCardV2 key={r.slug} recipe={r} />
        ))}
      </div>
    </section>
  );
}
