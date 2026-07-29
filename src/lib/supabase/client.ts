import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser Supabase client (singleton). Falls back to placeholder credentials
 * when the environment isn't configured so the app can render its setup
 * guidance instead of crashing at import time.
 */
export function getSupabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      SUPABASE_URL || "https://placeholder.supabase.co",
      SUPABASE_ANON_KEY || "placeholder-anon-key"
    );
  }
  return client;
}
