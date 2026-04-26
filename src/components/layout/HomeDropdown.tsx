"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function HomeDropdown() {
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
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-orange-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Home
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-40 bg-white rounded-lg border border-neutral-200 shadow-lg z-50 py-1">
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-neutral-200 rotate-45" />
          <div className="relative">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-neutral-700 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-neutral-700 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 transition-colors"
            >
              About Me
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="block text-sm text-neutral-700 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function HomeDropdownMobile() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-neutral-700 hover:text-orange-700 hover:bg-neutral-50 rounded-lg transition-colors"
      >
        Home
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="ml-4 space-y-0.5 pb-1">
          <Link
            href="/"
            className="block px-3 py-1.5 text-sm text-neutral-600 hover:text-orange-700 hover:bg-neutral-50 rounded transition-colors"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="block px-3 py-1.5 text-sm text-neutral-600 hover:text-orange-700 hover:bg-neutral-50 rounded transition-colors"
          >
            About Me
          </Link>
          <Link
            href="/contact"
            className="block px-3 py-1.5 text-sm text-neutral-600 hover:text-orange-700 hover:bg-neutral-50 rounded transition-colors"
          >
            Contact
          </Link>
        </div>
      )}
    </div>
  );
}
