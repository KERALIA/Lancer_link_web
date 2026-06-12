import { createClient } from "@supabase/supabase-js";
import { supabaseFetch } from "@/lib/supabase-fetch";

export { SUPABASE_NOT_CONFIGURED_ERROR } from "@/lib/supabase-constants";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY = "placeholder_anon_key";
const PLACEHOLDER_SERVICE_ROLE_KEY = "placeholder_service_role_key";

function isPlaceholderValue(value, placeholder) {
  if (!value) return true;
  const v = value.trim();
  return v === placeholder || v.startsWith("placeholder");
}

/**
 * True when real Supabase credentials are set (not empty / placeholder).
 */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (isPlaceholderValue(url, PLACEHOLDER_URL)) return false;
  if (isPlaceholderValue(anonKey, PLACEHOLDER_ANON_KEY)) return false;
  if (isPlaceholderValue(serviceRoleKey, PLACEHOLDER_SERVICE_ROLE_KEY)) {
    return false;
  }

  return true;
}

/**
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();
  return createClient(url, anonKey, {
    global: { fetch: supabaseFetch },
    auth: {
      flowType: "pkce",
    },
  });
}

let adminSingleton = null;

/**
 * Service-role client — server-only. Returns null if env is not configured.
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();

  if (!adminSingleton) {
    adminSingleton = createClient(url, serviceRoleKey, {
      global: { fetch: supabaseFetch },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminSingleton;
}
