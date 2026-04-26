"use client";

import { useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications, PushState } from "@/lib/use-push-notifications";

export function PushNotificationPrompt() {
  const { state, loading, subscribe, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if unsupported, already subscribed, denied, or dismissed
  if (state === "unsupported" || state === "denied" || state === "subscribed" || dismissed) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800">
            Get shopping list reminders
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            We&apos;ll send you your weekly shopping list based on your meal plan so you never forget an ingredient.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={subscribe}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Bell className="h-3.5 w-3.5" />
              {loading ? "Enabling..." : "Enable Notifications"}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-neutral-400 hover:text-neutral-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PushNotificationToggle() {
  const { state, loading, subscribe, unsubscribe } = usePushNotifications();

  if (state === "unsupported") return null;

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <BellOff className="h-4 w-4" />
        <span>Notifications blocked in browser settings</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
        state === "subscribed"
          ? "text-orange-700 bg-orange-50 hover:bg-orange-100"
          : "text-neutral-600 bg-neutral-100 hover:bg-neutral-200"
      }`}
    >
      {state === "subscribed" ? (
        <>
          <Bell className="h-4 w-4" />
          {loading ? "Disabling..." : "Notifications On"}
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          {loading ? "Enabling..." : "Enable Notifications"}
        </>
      )}
    </button>
  );
}
