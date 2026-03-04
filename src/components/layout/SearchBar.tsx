"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/recipes?q=${encodeURIComponent(trimmed)}`);
      setQuery("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative" role="search">
      <label htmlFor="header-search" className="sr-only">
        Search recipes
      </label>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
      <input
        id="header-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search recipes..."
        className="w-full md:w-64 pl-9 pr-4 py-2 text-sm rounded-full border border-stone-300 bg-stone-50 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
      />
    </form>
  );
}
