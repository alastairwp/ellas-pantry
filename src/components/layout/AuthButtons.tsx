"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Heart } from "lucide-react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-16 animate-pulse rounded-lg bg-stone-100" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/saved-recipes"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-red-500 transition-colors"
        title="My Favourites"
      >
        <Heart className="h-4 w-4" />
        <span className="hidden sm:inline">Favourites</span>
      </Link>
      {session.user.role === "admin" && (
        <Link
          href="/admin"
          className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
        >
          Admin
        </Link>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
