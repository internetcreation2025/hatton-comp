/**
 * Service worker. Version 2.
 *
 * Two jobs only: receive push notifications, and open the right game when one
 * is tapped. Deliberately no offline caching — a stale games list would be
 * worse than no games list.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let payload = { title: "Hatton Competitors", body: "", url: "/" };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url },
      // Same game shouldn't stack up half a dozen notifications.
      tag: payload.url,
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Make it absolute. A relative path works for openWindow but not reliably
  // for navigate(), and getting this wrong is why taps used to land on the
  // games list instead of the game.
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Already looking at it — just bring it forward.
      for (const client of windows) {
        if (client.url === target && "focus" in client) {
          return client.focus();
        }
      }

      // Otherwise steer an open window to the game. navigate() isn't supported
      // everywhere and can reject, so treat failure as "open a new one".
      for (const client of windows) {
        if ("navigate" in client && "focus" in client) {
          try {
            const navigated = await client.navigate(target);
            return (navigated || client).focus();
          } catch {
            // fall through to opening a window
          }
        }
      }

      return self.clients.openWindow(target);
    })(),
  );
});
