"use client";

import { useState } from "react";
import { buildMessageWithLink, postToWhatsApp } from "./postToWhatsApp";

/** Always present on a game, in WhatsApp's own green so it's unmistakable. */
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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3.5 text-[16px] font-semibold text-white"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.2 1.25-1.97 1.41-.53.11-1.21.2-3.51-.75-2.95-1.22-4.85-4.21-5-4.41-.14-.2-1.19-1.58-1.19-3.02s.76-2.14 1.03-2.43c.27-.29.58-.37.78-.37.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.02.9 2.17.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.3.37-.42.5-.14.14-.29.29-.12.58.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.15.46.12.63-.07.17-.2.72-.84.91-1.13.19-.29.39-.24.65-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.72-.17 1.4z" />
      </svg>
      {copied ? "Copied — paste it into the group" : "Post this to WhatsApp"}
    </button>
  );
}
