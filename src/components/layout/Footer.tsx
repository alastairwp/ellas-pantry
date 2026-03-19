import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-50 border-t border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            &copy; {currentYear} Ella&apos;s Pantry. All rights reserved.
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-stone-500 hover:text-amber-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-stone-500 hover:text-amber-700 transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/contact"
              className="text-sm text-stone-500 hover:text-amber-700 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/sitemap.xml"
              className="text-sm text-stone-500 hover:text-amber-700 transition-colors"
            >
              Sitemap
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
