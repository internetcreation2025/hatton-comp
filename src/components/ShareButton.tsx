"use client";

import { useState } from "react";
import { buildMessageWithLink, postToWhatsApp } from "./postToWhatsApp";

/**
 * The quiet version, always available at the bottom of a game. The loud one
 * that appears right after something happens is PostPrompt.
 */
export default function ShareButton({
  message,
  gameId,
}: {
  message: string;
  gameId: string;
}) {
  const [copied, setCopied] = useState(false);

  function post() {
    if (postToWhatsApp(message, gameId)) return;

    navigator.clipboard?.writeText(buildMessageWithLink(message, gameId)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
      () => undefined,
    );
  }

  return (
    <button
      type="button"
      onClick={post}
      className="mx-auto flex items-center gap-1.5 py-1 text-[14px] font-medium text-muted underline underline-offset-4"
    >
      {copied ? "Copied — paste it into the group" : "Post this to WhatsApp"}
    </button>
  );
}
