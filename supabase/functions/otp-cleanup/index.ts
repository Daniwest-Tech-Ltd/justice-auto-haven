import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting OTP cleanup job...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get expired OTPs
    const { data: expiredOTPs, error: fetchError } = await supabase
      .from("two_factor_auth")
      .select("id, user_id, code")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired OTPs:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredOTPs?.length || 0} expired OTPs`);

    if (!expiredOTPs || expiredOTPs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired OTPs to clean up",
          deleted: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Log audit trail for each expired OTP before deletion
    const auditEntries = expiredOTPs.map(otp => ({
      otp_id: otp.id,
      user_id: otp.user_id,
      action: "expired",
      performed_by: null,
      metadata: {
        code: otp.code,
        reason: "Automatic cleanup - expired",
        cleanup_time: new Date().toISOString()
      }
    }));

    const { error: auditError } = await supabase
      .from("otp_audit_trail")
      .insert(auditEntries);

    if (auditError) {
      console.error("Error logging audit trail:", auditError);
      // Continue with cleanup even if audit fails
    }

    // Delete expired OTPs
    const { error: deleteError } = await supabase
      .from("two_factor_auth")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (deleteError) {
      console.error("Error deleting expired OTPs:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully cleaned up ${expiredOTPs.length} expired OTPs`);

    // Log system event
    await supabase.from("system_logs").insert({
      type: "otp_cleanup",
      severity: "info",
      message: `Cleaned up ${expiredOTPs.length} expired OTP codes`,
      metadata: {
        deleted_count: expiredOTPs.length,
        cleanup_time: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully cleaned up ${expiredOTPs.length} expired OTPs`,
        deleted: expiredOTPs.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("OTP cleanup error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
