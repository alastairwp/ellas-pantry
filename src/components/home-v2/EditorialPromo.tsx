import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PROMOS = [
  {
    label: "Collection",
    title: "30-minute weeknight dinners",
    body: "Quick, fuss-free meals on the table by 7pm.",
    href: "/recipes?sort=quickest",
  },
  {
    label: "Collection",
    title: "Cosy comfort food",
    body: "Bakes, soups, and stews for chilly evenings.",
    href: "/categories/comfort",
  },
  {
    label: "Tools",
    title: "Plan your week",
    body: "Drag, drop, and shop — meal-plan in minutes.",
    href: "/meal-planner",
  },
];

export function EditorialPromo() {
  return (
    <section className="bg-neutral-700">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
              From the kitchen
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-white sm:text-4xl">
              Collections we love
            </h2>
          </div>
          <Link
            href="/collections"
            className="hidden items-center gap-1 text-sm font-medium text-orange-400 hover:text-orange-300 sm:inline-flex"
          >
            See all collections <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROMOS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group block rounded-2xl border border-neutral-600 bg-neutral-600/50 p-6 transition-colors hover:border-orange-500"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                {p.label}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-white group-hover:text-orange-300">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-300">{p.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-400">
                Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
