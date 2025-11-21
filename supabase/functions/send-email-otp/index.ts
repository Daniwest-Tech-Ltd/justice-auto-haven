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
    const { userId, purpose = 'login' } = await req.json();

    if (!userId) {
      throw new Error("Missing userId");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 10 minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const { error: otpError } = await supabase
      .from("user_otps")
      .insert({
        user_id: userId,
        code,
        purpose,
        expires_at: expiresAt,
        used: false
      });

    if (otpError) throw otpError;

    // Send email (you can integrate with Resend or other email service)
    console.log(`OTP ${code} generated for user ${userId} (${profile.email})`);

    // Log to audit trail
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "otp_generated",
      metadata: { purpose, email: profile.email }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email",
        expiresIn: 600 // seconds
      }),
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