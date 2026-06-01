import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnvOrThrow } from "@/lib/supabase-env";

/**
 * Browser Supabase client for auth and data.
 * Uses @supabase/ssr so sessions are stored in cookies (required for middleware).
 */
let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvOrThrow();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabase(): SupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvOrThrow();
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

/** Singleton browser client (lazy — safe when env is loaded after dev server start). */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver);
  },
});
