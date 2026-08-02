"use client";

import { useState } from "react";

/**
 * Posts a tidy summary of the game into WhatsApp.
 *
 * This goes straight to WhatsApp rather than the phone's generic share sheet,
 * so it's one tap to the chat list with "Hatton competitors" sitting at the
 * top. WhatsApp gives no way to pre-select a group — the picker is theirs, not
 * ours — so that final tap can't be removed by any app.
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

    // Opens the WhatsApp app on a phone, WhatsApp Web on a computer.
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
    <div>
      <button
        type="button"
        onClick={post}
        className="w-full rounded-xl border border-line px-4 py-3 text-[15px] font-semibold text-ink"
      >
        {copied ? "Copied — paste it into the group" : "Post to WhatsApp"}
      </button>
      <p className="mt-1.5 text-center text-[13px] text-muted">
        Opens WhatsApp with the message ready. Pick Hatton competitors.
      </p>
    </div>
  );
}
