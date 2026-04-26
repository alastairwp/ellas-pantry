import Link from "next/link";
import Image from "next/image";
import type { RecipeCardData } from "@/types/recipe";

export function FeaturedCollage({ recipes }: { recipes: RecipeCardData[] }) {
  if (recipes.length === 0) return null;

  const [hero, ...rest] = recipes;
  const grid = rest.slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Featured
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-neutral-700">
            Editor&apos;s picks this week
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Big card */}
        <Link
          href={`/recipes/${hero.slug}`}
          className="group relative block overflow-hidden rounded-2xl bg-neutral-700"
        >
          <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-full lg:min-h-[480px]">
            <Image
              src={hero.heroImage}
              alt={hero.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={hero.heroImage.startsWith("/")}
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-neutral-700/95 via-neutral-700/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <span className="inline-block rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Top pick
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-white sm:text-3xl">
                {hero.title}
              </h3>
              {hero.description && (
                <p className="mt-2 line-clamp-2 max-w-xl text-sm text-neutral-200">
                  {hero.description}
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* 2x2 grid */}
        <div className="grid grid-cols-2 gap-4">
          {grid.map((r) => (
            <Link
              key={r.slug}
              href={`/recipes/${r.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-neutral-700"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={r.heroImage}
                  alt={r.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized={r.heroImage.startsWith("/")}
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-700/95 via-neutral-700/50 to-transparent" />
                <h4 className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold text-white">
                  {r.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
