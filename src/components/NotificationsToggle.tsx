"use client";

import { useEffect, useState } from "react";

/**
 * The one notifications switch.
 *
 * iPhones only allow web push once the app has been added to the Home Screen,
 * so on iOS Safari we show the install steps instead of a toggle that couldn't
 * work. Android and desktop can turn it on straight away.
 */

type Status = "loading" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own flag, which predates the standard one.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalised);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export default function NotificationsToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (isIos() && !isStandalone()) {
        setStatus("needs-install");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("blocked");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    }

    check().catch(() => setStatus("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ) as BufferSource,
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) throw new Error("save failed");

      setStatus("on");
    } catch (err) {
      console.error("[notifications] could not turn on", err);
      setError("Couldn't switch notifications on. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      console.error("[notifications] could not turn off", err);
      setError("Couldn't switch them off. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <p className="text-[15px] text-muted">Checking…</p>;
  }

  if (status === "needs-install") {
    return (
      <div className="text-[15px] leading-relaxed">
        <p className="font-medium">Add the app to your Home Screen first</p>
        <p className="mt-1 text-muted">
          iPhones only allow notifications once the app is installed. It takes
          about ten seconds:
        </p>
        <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-muted">
          <li>
            Tap the <span className="text-ink">Share</span> button at the bottom
            of Safari (the square with an arrow coming out of it).
          </li>
          <li>
            Scroll down and tap{" "}
            <span className="text-ink">Add to Home Screen</span>.
          </li>
          <li>Tap Add, then open Hatton Competitors from your Home Screen.</li>
          <li>Come back to this page and the switch will be here.</li>
        </ol>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="text-[15px] leading-relaxed text-muted">
        This browser can&apos;t do notifications. You&apos;ll still see
        everything when you open the app, and games get shared to WhatsApp.
      </p>
    );
  }

  if (status === "blocked") {
    return (
      <p className="text-[15px] leading-relaxed text-muted">
        Notifications are blocked in your phone&apos;s settings for this app.
        Allow them there, then come back.
      </p>
    );
  }

  const on = status === "on";

  return (
    <div>
      <button
        type="button"
        onClick={on ? turnOff : turnOn}
        disabled={busy}
        aria-pressed={on}
        className={`w-full rounded-xl px-4 py-3.5 text-[15px] font-semibold disabled:opacity-60 ${
          on ? "border border-line text-ink" : "bg-accent text-accent-ink"
        }`}
      >
        {busy ? "…" : on ? "Turn notifications off" : "Turn notifications on"}
      </button>

      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {on
          ? "You'll be told when a game is set up, fills up, loses a player, or is about to start."
          : "Get a nudge when a game is set up or a spot opens."}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
