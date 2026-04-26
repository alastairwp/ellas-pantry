"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ChangeEmailFormProps {
  currentEmail: string;
  hasPassword: boolean;
}

export function ChangeEmailForm({ currentEmail, hasPassword }: ChangeEmailFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [email, setEmail] = useState(currentEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Email updated successfully.");
        setIsError(false);
        setEmail(data.email);
        setNewEmail("");
        setPassword("");
      } else {
        setMessage(data.error || "Failed to update email.");
        setIsError(true);
      }
    } catch {
      setMessage("Something went wrong.");
      setIsError(true);
    }

    setSaving(false);
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400";

  return (
    <div>
      <h3 className="text-lg font-semibold text-neutral-800">Email Address</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Current email: <span className="font-medium text-neutral-700">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="newEmail" className="block text-sm font-medium text-neutral-700">
            New Email
          </label>
          <input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>

        {hasPassword && (
          <div>
            <label htmlFor="emailPassword" className="block text-sm font-medium text-neutral-700">
              Confirm Password
            </label>
            <input
              id="emailPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
        )}

        {message && (
          <p className={`text-sm ${isError ? "text-red-600" : "text-emerald-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Update Email"
          )}
        </button>
      </form>
    </div>
  );
}
