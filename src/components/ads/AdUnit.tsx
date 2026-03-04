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

export function AdUnit({ adSlot, adFormat, className = "" }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isProduction = process.env.NODE_ENV === "production";

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
        className={`ad-unit no-print flex items-center justify-center bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg text-stone-400 text-sm font-medium min-h-[90px] ${className}`}
        role="presentation"
      >
        Ad Placeholder ({adSlot})
      </div>
    );
  }

  return (
    <div className={`ad-unit no-print ${className}`}>
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
