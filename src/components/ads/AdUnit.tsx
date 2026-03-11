"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
  adSlot: string;
  adFormat: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

const AD_DIMENSIONS: Record<string, { minHeight: number; aspectRatio?: string }> = {
  horizontal: { minHeight: 90 },
  rectangle: { minHeight: 280, aspectRatio: "336/280" },
  vertical: { minHeight: 600, aspectRatio: "160/600" },
  auto: { minHeight: 250 },
};

export function AdUnit({ adSlot, adFormat, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isProduction = process.env.NODE_ENV === "production";

  const dimensions = AD_DIMENSIONS[adFormat] || AD_DIMENSIONS.auto;

  useEffect(() => {
    if (!isProduction) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded
    }
  }, [isProduction]);

  if (!isProduction) {
    return (
      <div
        className={`ad-unit no-print flex items-center justify-center bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg text-stone-400 text-sm font-medium ${className}`}
        style={{ minHeight: dimensions.minHeight }}
        role="presentation"
      >
        Ad Placeholder ({adSlot})
      </div>
    );
  }

  return (
    <div
      className={`ad-unit no-print ${className}`}
      style={{ minHeight: dimensions.minHeight }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
