import Link from "next/link";

interface Category {
  name: string;
  slug: string;
}

const GRADIENTS = [
  "from-orange-500 to-orange-700",
  "from-neutral-700 to-neutral-700",
  "from-orange-400 to-rose-500",
  "from-neutral-700 to-neutral-700",
  "from-orange-600 to-orange-500",
  "from-neutral-600 to-orange-700",
  "from-rose-500 to-orange-500",
  "from-orange-500 to-neutral-700",
];

const FALLBACK: Category[] = [
  { name: "Breakfast", slug: "breakfast" },
  { name: "Baking", slug: "baking" },
  { name: "Soups", slug: "soups" },
  { name: "Salads", slug: "salads" },
  { name: "Curries", slug: "curries" },
  { name: "Asian", slug: "asian" },
  { name: "Bread", slug: "bread" },
  { name: "Desserts", slug: "desserts" },
];

export function CuisineTiles({ categories }: { categories: Category[] }) {
  const source = categories.length > 0 ? categories : FALLBACK;
  const tiles = source.slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
          Discover
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-neutral-700 sm:text-3xl">
          Browse by category
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {tiles.map((c, i) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className={`group relative flex h-32 items-end overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-4 transition-transform hover:scale-[1.02] sm:h-40`}
          >
            <div className="absolute inset-0 bg-neutral-700/0 transition-colors group-hover:bg-neutral-700/15" />
            <h3 className="relative font-[family-name:var(--font-display)] text-xl font-semibold text-white drop-shadow-md sm:text-2xl">
              {c.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
