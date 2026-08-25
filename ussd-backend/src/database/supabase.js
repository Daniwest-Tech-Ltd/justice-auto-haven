/**
 * Supabase server-side client.
 * Uses the SERVICE ROLE key — this client bypasses Row Level Security,
 * so it must only ever live on the server. Never import it into frontend code.
 */
const { createClient } = require("@supabase/supabase-js");
const { config } = require("../config/environment");

let supabase = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} else {
  console.error(
    "[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — database operations will fail safely."
  );
}

/**
 * Safe wrapper: returns null instead of throwing when the client
 * is not configured, so the USSD flow can degrade gracefully.
 */
function getClient() {
  return supabase;
}

module.exports = { supabase, getClient };
