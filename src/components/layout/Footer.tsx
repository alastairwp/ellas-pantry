import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-700 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="inline-block rounded-lg bg-white p-2">
              <Image
                src="/images/ellas-pantry-logo-w.png"
                alt="Ella's Pantry"
                width={140}
                height={56}
                className="h-12 w-auto"
              />
            </div>
            <p className="mt-4 max-w-xs text-sm text-neutral-400">
              Recipes for every appetite — quick weeknight wins, big-batch bakes
              and crowd-pleasing classics, all in one pantry.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
              Browse
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/recipes" className="hover:text-orange-400 transition-colors">
                  All recipes
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-orange-400 transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/meal-planner" className="hover:text-orange-400 transition-colors">
                  Meal planner
                </Link>
              </li>
              <li>
                <Link href="/whats-in-my-fridge" className="hover:text-orange-400 transition-colors">
                  What&apos;s in my fridge?
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
              About
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-orange-400 transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-orange-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-400 transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-400 transition-colors">
                  Terms &amp; conditions
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-orange-400 transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-600 pt-6 text-center text-xs text-neutral-400">
          &copy; {currentYear} Ella&apos;s Pantry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
