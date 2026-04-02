"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushState = "unsupported" | "prompt" | "denied" | "subscribed" | "unsubscribed";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("unsupported");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    // Check current permission and subscription status
    const checkState = async () => {
      const permission = Notification.permission;
      if (permission === "denied") {
        setState("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(subscription ? "subscribed" : permission === "default" ? "prompt" : "unsubscribed");
      } catch {
        setState("prompt");
      }
    };

    checkState();
  }, []);

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      // Send subscription to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (res.ok) {
        setState("subscribed");
      }
    } catch {
      // Permission denied or other error
      if (Notification.permission === "denied") {
        setState("denied");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notify server
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setState("unsubscribed");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, subscribe, unsubscribe };
}
