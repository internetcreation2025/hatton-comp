"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildMessageWithLink, postToWhatsApp } from "./postToWhatsApp";

export type Occasion = "new" | "full" | "spot" | "off" | "needs";

const WORDING: Record<Occasion, { heading: string; sub: string; cta: string }> = {
  new: {
    heading: "Game's in. Tell the group.",
    sub: "Everyone with notifications on already knows. This puts it in the chat for anyone who hasn't.",
    cta: "Post to WhatsApp",
  },
  full: {
    heading: "That's four — game on.",
    sub: "Worth putting in the chat so nobody else turns up expecting a spot.",
    cta: "Post to WhatsApp",
  },
  spot: {
    heading: "A spot's opened up.",
    sub: "Post it and someone will grab it.",
    cta: "Post to WhatsApp",
  },
  off: {
    heading: "Game's cancelled.",
    sub: "Make sure nobody turns up — put it in the chat.",
    cta: "Post to WhatsApp",
  },
  needs: {
    heading: "This one still needs players.",
    sub: "A nudge in the chat usually does it.",
    cta: "Post to WhatsApp",
  },
};

/**
 * The loud prompt, shown immediately after something happens that the group
 * would want to know about. This is the moment the phone is already in
 * someone's hand — one tap to WhatsApp beats a link they have to remember.
 */
export default function PostPrompt({
  occasion,
  message,
  gameId,
}: {
  occasion: Occasion;
  message: string;
  gameId: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const words = WORDING[occasion];

  function post() {
    if (postToWhatsApp(message, gameId)) {
      dismiss();
      return;
    }

    navigator.clipboard?.writeText(buildMessageWithLink(message, gameId)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
      () => undefined,
    );
  }

  function dismiss() {
    // Drop the ?tell= so a refresh doesn't bring the prompt back.
    router.replace(`/game/${gameId}`);
  }

  return (
    <section className="rounded-2xl border border-accent/40 bg-surface p-4">
      <p className="text-[17px] font-semibold tracking-tight">{words.heading}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-muted">{words.sub}</p>

      <button
        type="button"
        onClick={post}
        className="mt-3 w-full rounded-xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-accent-ink"
      >
        {copied ? "Copied — paste it into the group" : words.cta}
      </button>

      <button
        type="button"
        onClick={dismiss}
        className="mt-2 w-full py-1.5 text-[14px] font-medium text-muted"
      >
        Not now
      </button>
    </section>
  );
}
