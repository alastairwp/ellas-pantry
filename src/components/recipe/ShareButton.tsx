"use client";

import { useState, useRef, useEffect } from "react";
import {
  Share2,
  Link as LinkIcon,
  Mail,
  X,
  Send,
} from "lucide-react";

interface ShareButtonProps {
  title: string;
  description: string;
  recipeId?: number;
  imageUrl?: string;
}

export function ShareButton({ title, description, recipeId, imageUrl }: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    if (recipeId) {
      fetch(`/api/recipes/${recipeId}/shares`)
        .then((r) => r.json())
        .then((d) => setShareCount(d.total))
        .catch(() => {});
    }
  }, [recipeId]);

  function trackShare(platform: string) {
    if (recipeId) {
      fetch(`/api/recipes/${recipeId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      }).then(() => {
        setShareCount((prev) => (prev !== null ? prev + 1 : 1));
      }).catch(() => {});
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: window.location.href,
        });
        trackShare("native");
      } catch {
        setShowDropdown(true);
      }
    } else {
      setShowDropdown(!showDropdown);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      trackShare("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  function getShareUrl(platform: string): string {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${title} - ${description}`);

    switch (platform) {
      case "email":
        return `mailto:?subject=${encodeURIComponent(title)}&body=${text}%0A%0A${url}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case "whatsapp":
        return `https://wa.me/?text=${text}%20${url}`;
      case "pinterest":
        return `https://pinterest.com/pin/create/button/?url=${url}&media=${encodeURIComponent(imageUrl || "")}&description=${text}`;
      case "telegram":
        return `https://t.me/share/url?url=${url}&text=${text}`;
      default:
        return "#";
    }
  }

  function handlePlatformClick(platform: string) {
    trackShare(platform);
  }

  return (
    <div className="relative no-print" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-orange-700 bg-neutral-100 hover:bg-orange-50 rounded-lg transition-colors"
        aria-label="Share recipe"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
        {shareCount !== null && shareCount > 0 && (
          <span className="ml-0.5 text-xs text-neutral-400">{shareCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 py-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <LinkIcon className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Link"}
          </button>

          <a
            href={getShareUrl("email")}
            onClick={() => handlePlatformClick("email")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>

          {imageUrl && (
            <a
              href={getShareUrl("pinterest")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handlePlatformClick("pinterest")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
              </svg>
              Pinterest
            </a>
          )}

          <a
            href={getShareUrl("twitter")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handlePlatformClick("twitter")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Twitter
          </a>

          <a
            href={getShareUrl("facebook")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handlePlatformClick("facebook")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>

          <a
            href={getShareUrl("whatsapp")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handlePlatformClick("whatsapp")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>

          <a
            href={getShareUrl("telegram")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handlePlatformClick("telegram")}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            Telegram
          </a>
        </div>
      )}
    </div>
  );
}
