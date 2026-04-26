import Link from "next/link";

interface Category {
  name: string;
  slug: string;
}

const FALLBACK_CATEGORIES: Category[] = [
  { name: "Breakfast", slug: "breakfast" },
  { name: "Lunch", slug: "lunch" },
  { name: "Dinner", slug: "dinner" },
  { name: "Baking", slug: "baking" },
  { name: "Soups", slug: "soups" },
  { name: "Salads", slug: "salads" },
  { name: "Curries", slug: "curries" },
  { name: "Asian", slug: "asian" },
  { name: "Bread", slug: "bread" },
  { name: "Desserts", slug: "desserts" },
  { name: "Vegan", slug: "vegan" },
  { name: "Quick & Easy", slug: "quick" },
];

export function CategoryChipStrip({ categories }: { categories: Category[] }) {
  const list = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <section className="bg-neutral-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {list.map((c) => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="flex-shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-orange-50 hover:text-orange-600 hover:ring-2 hover:ring-orange-300"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
