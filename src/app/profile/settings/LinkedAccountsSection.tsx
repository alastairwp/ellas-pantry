"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Link2, Unlink } from "lucide-react";

interface LinkedAccountsSectionProps {
  accounts: { provider: string }[];
  hasPassword: boolean;
}

export function LinkedAccountsSection({
  accounts: initialAccounts,
  hasPassword,
}: LinkedAccountsSectionProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const isGoogleLinked = accounts.some((a) => a.provider === "google");

  async function handleUnlink(provider: string) {
    setUnlinking(provider);
    setMessage("");

    try {
      const res = await fetch("/api/profile/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();

      if (res.ok) {
        setAccounts(accounts.filter((a) => a.provider !== provider));
        setMessage("Account unlinked.");
        setIsError(false);
      } else {
        setMessage(data.error || "Failed to unlink account.");
        setIsError(true);
      }
    } catch {
      setMessage("Something went wrong.");
      setIsError(true);
    }

    setUnlinking(null);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-800">Linked Accounts</h3>
      <p className="mt-1 text-sm text-stone-500">
        Manage the sign-in methods connected to your account.
      </p>

      <div className="mt-4 space-y-3">
        {/* Google */}
        <div className="flex items-center justify-between rounded-lg border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <div>
              <p className="text-sm font-medium text-stone-800">Google</p>
              <p className="text-xs text-stone-500">
                {isGoogleLinked ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {isGoogleLinked ? (
            <button
              type="button"
              onClick={() => handleUnlink("google")}
              disabled={unlinking === "google"}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              {unlinking === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
              Unlink
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/profile/settings" })}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              Link
            </button>
          )}
        </div>

        {/* Email/Password */}
        <div className="flex items-center justify-between rounded-lg border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-stone-800">Email & Password</p>
              <p className="text-xs text-stone-500">
                {hasPassword ? "Password set" : "No password set"}
              </p>
            </div>
          </div>
          {!hasPassword && (
            <p className="text-xs text-stone-400">
              Set a password in the Security tab
            </p>
          )}
        </div>
      </div>

      {message && (
        <p className={`mt-3 text-sm ${isError ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
