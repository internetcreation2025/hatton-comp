"use client";

import { useState } from "react";

/**
 * Drops a tidy summary of the game into WhatsApp. The app is the source of
 * truth; WhatsApp is still where people get shouted at.
 */
export default function ShareButton({
  summary,
  gameId,
}: {
  summary: string;
  gameId: string;
}) {
  const [copied, setCopied] = useState(false);

  function buildMessage() {
    const link = `${window.location.origin}/game/${gameId}`;
    return `${summary}\n${link}`;
  }

  async function share() {
    const message = buildMessage();

    // Phones get the proper share sheet; desktop falls back to a copy.
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        // User dismissed the share sheet — nothing to do.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="w-full rounded-xl border border-line px-4 py-3 text-[15px] font-semibold text-ink"
    >
      {copied ? "Copied — paste it into the group" : "Share to WhatsApp"}
    </button>
  );
}
