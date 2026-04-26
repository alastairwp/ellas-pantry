"use client";

import { useState } from "react";

interface ProfileSettingsFormProps {
  initialName: string;
  initialBio: string;
}

export function ProfileSettingsForm({
  initialName,
  initialBio,
}: ProfileSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
    });

    if (res.ok) {
      setMessage("Profile updated successfully.");
    } else {
      setMessage("Failed to update profile. Please try again.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-neutral-700"
        >
          Display Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-neutral-700"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Tell others a bit about yourself..."
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
        />
        <p className="mt-1 text-xs text-neutral-400">{bio.length}/200</p>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
