/// Service Worker for Ella's Pantry PWA

const CACHE_NAME = "ellas-pantry-v1";
const STATIC_ASSETS = ["/", "/recipes", "/meal-planner"];

// Install: pre-cache core pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback for navigations
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // For API requests, always go network
  if (request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "Ella's Pantry", body: "You have a new notification!" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/meal-planner",
    },
    actions: data.actions || [],
    tag: data.tag || "default",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  // Handle action button clicks
  if (event.action === "view-list") {
    event.waitUntil(clients.openWindow("/meal-planner?tab=shopping"));
    return;
  }

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return clients.openWindow(targetUrl);
      })
  );
});
