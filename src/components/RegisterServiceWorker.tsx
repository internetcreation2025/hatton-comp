"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every page. Without this, push notifications
 * stop arriving as soon as the browser retires the old registration.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[sw] registration failed", error);
    });
  }, []);

  return null;
}
