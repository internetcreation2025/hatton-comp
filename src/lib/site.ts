/**
 * The app's own address.
 *
 * Needed for link previews: WhatsApp will only show a preview card if the
 * image is given as a full URL, not a relative one. Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL automatically, so this needs no configuration.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return "http://localhost:3000";
}
