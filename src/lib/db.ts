import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one and only database connection.
 *
 * This uses the service_role key, which bypasses every security rule in the
 * database. That is deliberate: this app has no Supabase user accounts, so the
 * server does the checking instead. It also means this file must NEVER be
 * imported by anything that runs in the browser — the "server-only" import at
 * the top makes the build fail loudly if that ever happens.
 */

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. See .env.example.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
