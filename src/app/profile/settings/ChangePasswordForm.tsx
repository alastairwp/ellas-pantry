"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ChangePasswordFormProps {
  hasPassword: boolean;
}

export function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      setSaving(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setIsError(true);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(hasPassword ? "Password changed." : "Password set successfully.");
        setIsError(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data.error || "Failed to update password.");
        setIsError(true);
      }
    } catch {
      setMessage("Something went wrong.");
      setIsError(true);
    }

    setSaving(false);
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400";

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-800">
        {hasPassword ? "Change Password" : "Set a Password"}
      </h3>
      <p className="mt-1 text-sm text-stone-500">
        {hasPassword
          ? "Update your account password."
          : "Set a password to sign in with email and password."}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {hasPassword && (
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-stone-700">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required={hasPassword}
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-stone-700">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        {message && (
          <p className={`text-sm ${isError ? "text-red-600" : "text-emerald-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : hasPassword ? (
            "Change Password"
          ) : (
            "Set Password"
          )}
        </button>
      </form>
    </div>
  );
}
