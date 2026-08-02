/**
 * Opens WhatsApp with the message written and ready to send.
 *
 * The link gets a changing `?v=` on the end every time. WhatsApp caches a
 * preview card per URL, so without this a second post about the same game
 * would show the first post's stale line-up. A fresh URL means a fresh card.
 *
 * Returns false if a pop-up blocker got in the way, so the caller can offer
 * the clipboard instead.
 */
export function postToWhatsApp(message: string, gameId: string): boolean {
  const stamp = Math.random().toString(36).slice(2, 8);
  const link = `${window.location.origin}/game/${gameId}?v=${stamp}`;

  const opened = window.open(
    `https://wa.me/?text=${encodeURIComponent(`${message}\n${link}`)}`,
    "_blank",
    "noopener,noreferrer",
  );

  return Boolean(opened);
}

export function buildMessageWithLink(message: string, gameId: string): string {
  return `${message}\n${window.location.origin}/game/${gameId}`;
}
