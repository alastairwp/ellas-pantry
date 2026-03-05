"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";

interface RecipeImageProps {
  src: string;
  alt: string;
}

export function RecipeImage({ src, alt }: RecipeImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block w-40 h-40 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        <Image
          src={src}
          alt={alt}
          width={160}
          height={160}
          className="w-full h-full object-cover"
          sizes="160px"
          unoptimized={src.startsWith("/")}
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-bold z-10 focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={900}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              sizes="(max-width: 1200px) 100vw, 1200px"
              unoptimized={src.startsWith("/")}
            />
          </div>
        </div>
      )}
    </>
  );
}
