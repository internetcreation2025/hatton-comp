/**
 * Who you are, in a cookie.
 *
 * There are no passwords in this app. Once someone has entered the group code
 * and chosen their name, we hand their browser a cookie containing their member
 * id plus a signature. The signature is made with SESSION_SECRET, which only the
 * server knows — so nobody can edit the cookie to become someone else.
 *
 * Uses Web Crypto (not Node's crypto) so the same code works in middleware.
 */

export const SESSION_COOKIE = "hp_member";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // one year

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");

  cachedKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    new TextEncoder().encode(value),
  );
  return toBase64Url(new Uint8Array(signature));
}

/** Turn a member id into the value we store in the cookie. */
export async function createSessionToken(memberId: string): Promise<string> {
  return `${memberId}.${await sign(memberId)}`;
}

/** Read a cookie value back. Returns the member id, or null if it's been tampered with. */
export async function readSessionToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const memberId = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = await sign(memberId);

  // Constant-time-ish comparison so we don't leak the signature a byte at a time.
  if (signature.length !== expected.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0 ? memberId : null;
}
