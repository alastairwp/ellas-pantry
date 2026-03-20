"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavBarProps {
  children: React.ReactNode;
}

export function NavBar({ children }: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6">{children}</nav>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-stone-200 shadow-lg md:hidden z-50">
          <nav className="flex flex-col p-4 gap-2">
            {children}
          </nav>
        </div>
      )}
    </>
  );
}
