import { supabase } from "@/integrations/supabase/client";

/**
 * Dual-write utility for Justice Ultimate.
 * Writes to Supabase (Primary) and mirrors to Neon (Secondary) via Edge Function.
 * SECURITY: All sensitive connection strings are handled on the server side (Edge Functions).
 */
export async function dualWrite(tableName: string, data: any, action: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT') {
  try {
    // 1. Primary Write (Supabase)
    let primaryResult;

    if (action === 'INSERT') {
      primaryResult = await supabase.from(tableName).insert(data).select();
    } else if (action === 'UPDATE') {
      primaryResult = await supabase.from(tableName).update(data).eq('id', data.id).select();
    } else if (action === 'DELETE') {
      primaryResult = await supabase.from(tableName).delete().eq('id', data.id).select();
    }

    if (primaryResult?.error) throw primaryResult.error;

    // 2. Mirror to Neon (Secondary) via Edge Function
    // The Edge Function uses environment secrets for the Neon connection string.
    supabase.functions.invoke('database-mirror', {
      body: {
        table: tableName,
        record: data,
        type: action,
        schema: 'public'
      }
    }).catch(err => console.error("Mirror background task warning:", err));

    return { success: true, data: primaryResult?.data };
  } catch (error) {
    console.error("Database Operation Failed:", error);
    return { success: false, error };
  }
}

/**
 * Global Database Configuration
 */
export const dbConfig = {
  primary: "Supabase",
  secondary: "Neon",
  active: localStorage.getItem("active_db") || "primary"
};
