"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ToggleSettingProps {
  label: string;
  description: string;
  settingKey: string;
}

function ToggleSetting({ label, description, settingKey }: ToggleSettingProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/settings?key=${settingKey}`)
      .then((r) => r.json())
      .then((d) => setEnabled(d.value === "true"))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [settingKey]);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: String(next) }),
      });
      if (res.ok) setEnabled(next);
    } catch {
      // revert on error
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
        <span className="text-sm text-stone-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-stone-100 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-amber-600" : "bg-stone-300"
        } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SiteSettings() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800">Site Settings</h2>
      <p className="mt-1 text-sm text-stone-500">
        Configure authentication and site-wide options.
      </p>

      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-2">
          Authentication
        </h3>
        <ToggleSetting
          label="Google Sign-In"
          description="Allow users to sign in and register with their Google account."
          settingKey="google-auth-enabled"
        />
      </div>
    </div>
  );
}
