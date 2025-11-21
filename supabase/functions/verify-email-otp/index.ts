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
    const { userId, code, purpose = 'login' } = await req.json();

    if (!userId || !code) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabase
      .from("user_otps")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("purpose", purpose)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      // Log failed attempt
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "otp_verification_failed",
        metadata: { purpose, reason: "invalid_or_expired" }
      });

      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired OTP" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Mark OTP as used
    await supabase
      .from("user_otps")
      .update({ used: true })
      .eq("id", otpData.id);

    // Log successful verification
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "otp_verified",
      metadata: { purpose }
    });

    return new Response(
      JSON.stringify({ success: true, message: "OTP verified successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});