"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Heart, Settings, LogOut, Shield, User } from "lucide-react";

export function AuthButtons() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-neutral-600 hover:text-orange-700 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const name = session.user.name || session.user.email || "?";
  const initial = name.charAt(0).toUpperCase();
  const image = session.user.image;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
        aria-label="User menu"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg z-50">
          <div className="px-4 py-2 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-800 truncate">{name}</p>
            {session.user.email && name !== session.user.email && (
              <p className="text-xs text-neutral-500 truncate">{session.user.email}</p>
            )}
          </div>

          <Link
            href={`/profile/${session.user.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <User className="h-4 w-4 text-neutral-400" />
            Public Profile
          </Link>

          <Link
            href="/saved-recipes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Heart className="h-4 w-4 text-neutral-400" />
            Favourites
          </Link>

          <Link
            href="/profile/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Settings className="h-4 w-4 text-neutral-400" />
            Settings
          </Link>

          {session.user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Shield className="h-4 w-4 text-neutral-400" />
              Admin
            </Link>
          )}

          <div className="border-t border-neutral-100 mt-1">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-neutral-400" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
