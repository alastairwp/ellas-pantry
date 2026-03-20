import Link from "next/link";
import { NavBar } from "./NavBar";
import { SearchBar } from "./SearchBar";
import { AuthButtons } from "./AuthButtons";
import { MegaMenu, MegaMenuMobile } from "./MegaMenu";
import { HomeDropdown, HomeDropdownMobile } from "./HomeDropdown";
import { getCategories } from "@/lib/categories";
import { getActiveOccasions } from "@/lib/occasions";
import { prisma } from "@/lib/prisma";

export async function Header() {
  let menuData = {
    categories: [] as { name: string; slug: string }[],
    dietaryTags: [] as { name: string; slug: string }[],
    activeOccasions: [] as { name: string; slug: string }[],
  };

  try {
    const [categories, dietaryTags, activeOccasions] = await Promise.all([
      getCategories(),
      prisma.dietaryTag.findMany({ orderBy: { name: "asc" } }),
      getActiveOccasions(),
    ]);

    menuData = {
      categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
      dietaryTags: dietaryTags.map((t) => ({ name: t.name, slug: t.slug })),
      activeOccasions: activeOccasions.map((o) => ({ name: o.name, slug: o.slug })),
    };
  } catch {
    // Database unavailable during build — render with empty menu data
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-stone-200">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl text-amber-700 hover:text-amber-800 transition-colors"
          style={{ fontFamily: "cursive" }}
        >
          <span className="text-2xl" role="img" aria-hidden="true">
            {/* Inline SVG icon to avoid emoji */}
          </span>
          Ella&apos;s Pantry
        </Link>

        {/* Desktop navigation + search */}
        <div className="hidden md:flex items-center gap-8">
          <NavBar>
            <HomeDropdown />
            <MegaMenu {...menuData} />
            <Link
              href="/meal-planner"
              className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
            >
              Meal Planner
            </Link>
            <Link
              href="/whats-in-my-fridge"
              className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
            >
              My Fridge
            </Link>
            <Link
              href="/collections"
              className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
            >
              Collections
            </Link>
          </NavBar>
          <SearchBar />
          <AuthButtons />
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden flex items-center gap-3">
          <NavBar>
            <HomeDropdownMobile />
            <MegaMenuMobile {...menuData} />
            <Link
              href="/meal-planner"
              className="block px-3 py-2 text-base font-medium text-stone-700 hover:text-amber-700 hover:bg-stone-50 rounded-lg transition-colors"
            >
              Meal Planner
            </Link>
            <Link
              href="/whats-in-my-fridge"
              className="block px-3 py-2 text-base font-medium text-stone-700 hover:text-amber-700 hover:bg-stone-50 rounded-lg transition-colors"
            >
              My Fridge
            </Link>
            <Link
              href="/collections"
              className="block px-3 py-2 text-base font-medium text-stone-700 hover:text-amber-700 hover:bg-stone-50 rounded-lg transition-colors"
            >
              Collections
            </Link>
            <div className="pt-2 border-t border-stone-200 mt-2">
              <SearchBar />
            </div>
            <div className="pt-2 border-t border-stone-200 mt-2 px-3 py-2">
              <AuthButtons />
            </div>
          </NavBar>
        </div>
      </div>
    </header>
  );
}
