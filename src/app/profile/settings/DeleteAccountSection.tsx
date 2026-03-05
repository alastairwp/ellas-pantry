"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteAccountSectionProps {
  hasPassword: boolean;
}

export function DeleteAccountSection({ hasPassword }: DeleteAccountSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });

      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete account.");
        setDeleting(false);
      }
    } catch {
      setError("Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-red-800">Delete Account</h3>
          <p className="mt-1 text-sm text-red-600">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
        </div>
      </div>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Delete My Account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {hasPassword ? (
            <div>
              <label htmlFor="deletePassword" className="block text-sm font-medium text-red-800">
                Enter your password to confirm
              </label>
              <input
                id="deletePassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 block w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm text-stone-800 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="deleteConfirmation" className="block text-sm font-medium text-red-800">
                Type <span className="font-bold">DELETE</span> to confirm
              </label>
              <input
                id="deleteConfirmation"
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm text-stone-800 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || (hasPassword ? !password : confirmation !== "DELETE")}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Permanently Delete"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setPassword("");
                setConfirmation("");
                setError("");
              }}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
