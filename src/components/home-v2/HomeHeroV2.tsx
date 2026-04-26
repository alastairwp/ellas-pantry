import Link from "next/link";
import Image from "next/image";

interface Props {
  collageImages?: string[];
}

export function HomeHeroV2({ collageImages = [] }: Props) {
  const tiles = collageImages.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100/60">
      {/* Decorative orange accent block */}
      <div
        aria-hidden="true"
        className="absolute -top-24 right-1/3 h-96 w-96 rounded-full bg-orange-500/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-8 lg:py-20">
        {/* Left: copy */}
        <div className="flex flex-col justify-center text-center lg:text-left">
          <span className="mx-auto inline-block rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 shadow-sm ring-1 ring-orange-200 lg:mx-0">
            Made with love · Ella&apos;s Pantry
          </span>
          <h1
            className="mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-neutral-700 sm:text-6xl lg:text-7xl"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}
          >
            Recipes for every{" "}
            <span className="relative inline-block text-orange-500">
              appetite
              <svg
                aria-hidden="true"
                viewBox="0 0 200 12"
                className="absolute -bottom-2 left-0 h-3 w-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6 Q 50 0, 100 6 T 200 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-orange-500"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-neutral-700/85 sm:text-xl">
            Browse thousands of tried-and-tested dishes — quick weeknight wins,
            big-batch bakes, and crowd-pleasing classics.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/recipes"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30"
            >
              Browse all recipes
            </Link>
            <Link
              href="/whats-in-my-fridge"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-neutral-300 transition-all hover:ring-orange-400 hover:text-orange-600"
            >
              What&apos;s in my fridge?
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-neutral-700/70 lg:justify-start">
            <span className="flex items-center gap-1.5">
              <span className="text-orange-500">★</span> 4.7 average rating
            </span>
            <span aria-hidden="true">·</span>
            <span>10,000+ recipes</span>
          </div>
        </div>

        {/* Right: image collage */}
        {tiles.length >= 4 && (
          <div className="relative hidden h-[460px] lg:block">
            <div className="absolute right-0 top-0 h-64 w-64 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white">
              <Image
                src={tiles[0]}
                alt=""
                fill
                sizes="256px"
                className="object-cover"
                unoptimized={tiles[0].startsWith("/")}
                priority
              />
            </div>
            <div className="absolute left-0 top-12 h-44 w-44 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white">
              <Image
                src={tiles[1]}
                alt=""
                fill
                sizes="176px"
                className="object-cover"
                unoptimized={tiles[1].startsWith("/")}
              />
            </div>
            <div className="absolute bottom-0 left-12 h-56 w-56 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white">
              <Image
                src={tiles[2]}
                alt=""
                fill
                sizes="224px"
                className="object-cover"
                unoptimized={tiles[2].startsWith("/")}
              />
            </div>
            <div className="absolute bottom-12 right-4 h-48 w-48 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white">
              <Image
                src={tiles[3]}
                alt=""
                fill
                sizes="192px"
                className="object-cover"
                unoptimized={tiles[3].startsWith("/")}
              />
            </div>
            {/* Floating logo badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-5 py-3 shadow-2xl ring-4 ring-orange-100">
              <Image
                src="/images/ellas-pantry-logo-w.png"
                alt="Ella's Pantry"
                width={120}
                height={48}
                className="h-12 w-auto"
                priority
              />
            </div>
          </div>
        )}

        {/* Mobile collage fallback */}
        {tiles.length >= 2 && (
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {tiles.slice(0, 2).map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg ring-2 ring-white"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="50vw"
                  className="object-cover"
                  unoptimized={src.startsWith("/")}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
