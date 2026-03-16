"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Check } from "lucide-react";

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

interface SelectSettingProps {
  label: string;
  description: string;
  settingKey: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}

function SelectSetting({ label, description, settingKey, options, defaultValue }: SelectSettingProps) {
  const [value, setValue] = useState(defaultValue);
  const [savedValue, setSavedValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch(`/api/admin/settings?key=${settingKey}`)
      .then((r) => r.json())
      .then((d) => {
        const v = d.value || defaultValue;
        setValue(v);
        setSavedValue(v);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [settingKey, defaultValue]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value }),
      });
      if (res.ok) {
        setSavedValue(value);
        setSaved(true);
        clearTimeout(savedTimeout.current);
        savedTimeout.current = setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
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

  const isDirty = value !== savedValue;

  return (
    <div className="py-4 border-b border-stone-100 last:border-b-0">
      <div className="mb-2">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

interface TextSettingProps {
  label: string;
  description: string;
  settingKey: string;
  placeholder?: string;
  rows?: number;
}

function TextSetting({ label, description, settingKey, placeholder, rows = 3 }: TextSettingProps) {
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch(`/api/admin/settings?key=${settingKey}`)
      .then((r) => r.json())
      .then((d) => {
        const v = d.value ?? "";
        setValue(v);
        setSavedValue(v);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [settingKey]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value }),
      });
      if (res.ok) {
        setSavedValue(value);
        setSaved(true);
        clearTimeout(savedTimeout.current);
        savedTimeout.current = setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
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

  const isDirty = value !== savedValue;

  return (
    <div className="py-4 border-b border-stone-100 last:border-b-0">
      <div className="mb-2">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors resize-y"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
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

      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-2">
          Image Generation
        </h3>
        <p className="text-sm text-stone-500 mb-2">
          Customise the model and prompts used for image generation. Changes apply to the next generation run.
        </p>
        <SelectSetting
          label="Model"
          description="SDXL 1.0 produces higher quality images with better negative prompt support but is slower."
          settingKey="image-gen-model"
          defaultValue="sdxl"
          options={[
            { value: "sdxl", label: "SDXL 1.0 — High quality (~30-60s/image)" },
            { value: "sdxl-turbo", label: "SDXL Turbo — Fast (~3-5s/image)" },
          ]}
        />
        <TextSetting
          label="Extra prompt instructions"
          description="Appended to every image prompt. Use this to steer the style, e.g. &quot;bright and airy, minimalist white plate&quot;."
          settingKey="image-gen-extra-prompt"
          placeholder="e.g. bright and airy, minimalist white plate, no garnish"
        />
        <TextSetting
          label="Extra negative prompt"
          description="Appended to the negative prompt. List things to avoid, e.g. &quot;hands, fingers, utensils, text overlay&quot;."
          settingKey="image-gen-extra-negative"
          placeholder="e.g. hands, fingers, utensils, people, text overlay"
        />

        <div className="py-4">
          <p className="text-sm font-medium text-stone-800 mb-3">Prompt templates</p>
          <p className="text-sm text-stone-500 mb-3">
            These are the base prompts sent to the model for each recipe. Your extra prompt and negative settings above are appended to these.
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-1">Positive prompt</p>
              <div className="rounded-md bg-stone-50 border border-stone-200 px-3 py-2 text-sm text-stone-600 font-mono leading-relaxed">
                Professional food photography of <span className="text-amber-700 font-semibold">{"{{title}}"}</span>, beautifully plated and styled, made with <span className="text-amber-700 font-semibold">{"{{ingredients}}"}</span>, on a rustic wooden table, natural window lighting, shallow depth of field, appetizing, high detail, warm tones<span className="text-emerald-600 font-semibold">{", {{extra prompt}}"}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-1">Negative prompt</p>
              <div className="rounded-md bg-stone-50 border border-stone-200 px-3 py-2 text-sm text-stone-600 font-mono leading-relaxed">
                text, watermark, logo, blurry, cartoon, illustration, drawing, ugly, deformed, disfigured, low quality, bad anatomy, oversaturated, underexposed<span className="text-emerald-600 font-semibold">{", {{extra negative}}"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
