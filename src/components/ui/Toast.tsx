"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="bg-stone-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
        {message}
      </div>
    </div>
  );
}
