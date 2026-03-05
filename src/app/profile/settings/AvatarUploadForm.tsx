"use client";

import { useState, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Camera, Trash2, Loader2 } from "lucide-react";

interface AvatarUploadFormProps {
  currentImage: string | null;
  userName: string;
}

export function AvatarUploadForm({ currentImage, userName }: AvatarUploadFormProps) {
  const [image, setImage] = useState<string | null>(currentImage);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImage(data.image + "?t=" + Date.now());
        setMessage("Avatar updated.");
      } else {
        const data = await res.json();
        setMessage(data.error || "Upload failed.");
      }
    } catch {
      setMessage("Upload failed.");
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemove() {
    setUploading(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (res.ok) {
        setImage(null);
        setMessage("Avatar removed.");
      } else {
        setMessage("Failed to remove avatar.");
      }
    } catch {
      setMessage("Failed to remove avatar.");
    }

    setUploading(false);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-800">Profile Photo</h3>
      <div className="mt-3 flex items-center gap-4">
        <Avatar name={userName} image={image} size="lg" />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Upload Photo
            </button>
            {image && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-stone-400">JPG, PNG or WebP. Max 5MB.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
      {message && (
        <p className={`mt-2 text-sm ${message.includes("fail") || message.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
