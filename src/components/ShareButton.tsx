"use client";

import { useState } from "react";

/**
 * Posts a summary of the game into WhatsApp.
 *
 * Deliberately a small link rather than a button: the app's own notifications
 * are the noticeboard now, and this is the occasional extra nudge. It opens
 * WhatsApp directly, but WhatsApp gives no way to pre-select a group, so
 * choosing the chat is always the sender's tap to make.
 */
export default function ShareButton({
  summary,
  gameId,
}: {
  summary: string;
  gameId: string;
}) {
  const [copied, setCopied] = useState(false);

  function post() {
    const link = `${window.location.origin}/game/${gameId}`;
    const message = `${summary}\n${link}`;

    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );

    // Blocked by a pop-up blocker — fall back to the clipboard.
    if (!opened) {
      navigator.clipboard?.writeText(message).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        },
        () => undefined,
      );
    }
  }

  return (
    <button
      type="button"
      onClick={post}
      className="mx-auto flex items-center gap-1.5 py-1 text-[14px] font-medium text-muted underline underline-offset-4"
    >
      {copied ? "Copied — paste it into the group" : "Also post to WhatsApp"}
    </button>
  );
}
