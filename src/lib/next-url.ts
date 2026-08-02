/**
 * Where to send someone once they've joined.
 *
 * Only ever a path inside this app. Anything else — a full URL, a protocol-
 * relative "//evil.example" — falls back to the games list, so a doctored link
 * in the chat can't bounce someone off to another site after they've typed the
 * group code.
 */
export function safeNext(value: string | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  return value;
}
