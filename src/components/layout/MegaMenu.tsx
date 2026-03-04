"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface MegaMenuCategory {
  name: string;
  slug: string;
}

interface MegaMenuDietaryTag {
  name: string;
  slug: string;
}

interface MegaMenuOccasion {
  name: string;
  slug: string;
}

interface MegaMenuProps {
  categories: MegaMenuCategory[];
  dietaryTags: MegaMenuDietaryTag[];
  activeOccasions: MegaMenuOccasion[];
}

export function MegaMenu({
  categories,
  dietaryTags,
  activeOccasions,
}: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Recipes
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[600px] bg-white rounded-xl border border-stone-200 shadow-xl z-50 p-6">
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-stone-200 rotate-45" />

          <div className="relative grid grid-cols-3 gap-6">
            {/* Meal Type */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                Meal Type
              </h3>
              <ul className="space-y-1.5">
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block text-sm text-stone-700 hover:text-amber-700 hover:bg-amber-50 rounded px-2 py-1 -mx-2 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Diet Type */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                Diet Type
              </h3>
              <ul className="space-y-1.5">
                {dietaryTags.map((tag) => (
                  <li key={tag.slug}>
                    <Link
                      href={`/recipes?dietary=${tag.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block text-sm text-stone-700 hover:text-amber-700 hover:bg-amber-50 rounded px-2 py-1 -mx-2 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* This Season */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                This Season
              </h3>
              {activeOccasions.length > 0 ? (
                <ul className="space-y-1.5">
                  {activeOccasions.map((occ) => (
                    <li key={occ.slug}>
                      <Link
                        href={`/occasions/${occ.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="block text-sm text-stone-700 hover:text-amber-700 hover:bg-amber-50 rounded px-2 py-1 -mx-2 transition-colors"
                      >
                        {occ.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-400 italic">
                  No seasonal occasions right now
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-stone-100">
            <Link
              href="/recipes"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              View all recipes &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* Mobile version — accordion sections for the hamburger menu */
export function MegaMenuMobile({
  categories,
  dietaryTags,
  activeOccasions,
}: MegaMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggle(section: string) {
    setOpenSection(openSection === section ? null : section);
  }

  const sections = [
    {
      key: "meal",
      label: "Meal Type",
      items: categories.map((c) => ({
        name: c.name,
        href: `/categories/${c.slug}`,
      })),
    },
    {
      key: "diet",
      label: "Diet Type",
      items: dietaryTags.map((t) => ({
        name: t.name,
        href: `/recipes?dietary=${t.slug}`,
      })),
    },
    ...(activeOccasions.length > 0
      ? [
          {
            key: "season",
            label: "This Season",
            items: activeOccasions.map((o) => ({
              name: o.name,
              href: `/occasions/${o.slug}`,
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
        Recipes
      </p>
      {sections.map((section) => (
        <div key={section.key}>
          <button
            type="button"
            onClick={() => toggle(section.key)}
            className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-stone-700 hover:text-amber-700 hover:bg-stone-50 rounded-lg transition-colors"
          >
            {section.label}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${openSection === section.key ? "rotate-180" : ""}`}
            />
          </button>
          {openSection === section.key && (
            <div className="ml-4 space-y-0.5 pb-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-1.5 text-sm text-stone-600 hover:text-amber-700 hover:bg-stone-50 rounded transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
