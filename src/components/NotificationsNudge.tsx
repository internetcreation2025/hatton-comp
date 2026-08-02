"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "hp_nudge_dismissed";

/**
 * A one-line prompt on the games list for anyone who hasn't switched
 * notifications on yet.
 *
 * The app leans on notifications rather than WhatsApp now, so it matters that
 * people actually turn them on — but nobody should be nagged, so this can be
 * dismissed for good.
 */
export default function NotificationsNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function check() {
      if (localStorage.getItem(DISMISSED_KEY) === "1") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (Notification.permission === "denied") return;

      if (Notification.permission === "granted") {
        const registration = await navigator.serviceWorker.getRegistration();
        const existing = await registration?.pushManager.getSubscription();
        if (existing) return;
      }

      setShow(true);
    }

    check().catch(() => undefined);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <p className="flex-1 text-[14px] leading-relaxed">
        Turn on notifications and you&apos;ll know the moment a game is set up
        or a spot opens.{" "}
        <Link href="/me" className="font-semibold text-accent underline underline-offset-2">
          Set it up
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-muted"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
