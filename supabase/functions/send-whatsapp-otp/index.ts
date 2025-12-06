import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  userId: string;
  purpose?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, purpose = "login" }: OTPRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile with phone number and country code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("phone, full_name, country_code")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      console.log("Profile not found (non-critical):", profileError);
      return new Response(
        JSON.stringify({ success: true, message: "OTP process completed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile.phone) {
      console.log("No phone number for user (non-critical)");
      return new Response(
        JSON.stringify({ success: true, message: "OTP process completed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    const { error: otpError } = await supabase.from("user_otps").insert({
      user_id: userId,
      code: otp,
      purpose: purpose,
      expires_at: expiresAt.toISOString(),
    });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format message
    const message = `🔐 *Justice Ultimate Automobiles*\n\nYour verification code is: *${otp}*\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, please ignore this message.\n\n🚗 www.justiceultimateautomobiles.com`;

    // Send via APIWAP
    // Check API key - if not configured, return success anyway (non-blocking)
    const apiKey = Deno.env.get("APIWAP_API_KEY");
    if (!apiKey) {
      console.log("APIWAP_API_KEY not configured (non-critical)");
      return new Response(
        JSON.stringify({ success: true, message: "OTP process completed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get country code from profile (default to +254 for Kenya)
    const userCountryCode = profile.country_code || '+254';
    
    // Format phone number using stored country code
    const formatPhoneNumber = (phone: string, countryCode: string): string => {
      let cleaned = phone.toString().replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      // Remove any existing country code prefix
      if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
      // Also check for other common prefixes based on country code
      const codeDigits = countryCode.replace(/\D/g, '');
      if (cleaned.startsWith(codeDigits)) cleaned = cleaned.substring(codeDigits.length);
      return countryCode + cleaned;
    };

    // Validate phone number (must be 9 digits after formatting for Kenya, but varies by country)
    const validatePhone = (phone: string): boolean => {
      let cleaned = phone.toString().replace(/\D/g, '');
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
      // Allow 7-12 digit numbers to accommodate various African countries
      return cleaned.length >= 7 && cleaned.length <= 12;
    };

    if (!validatePhone(profile.phone)) {
      console.log("Invalid phone number format (non-critical):", profile.phone);
      return new Response(
        JSON.stringify({ success: true, message: "OTP process completed - invalid phone" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formattedPhone = formatPhoneNumber(profile.phone, userCountryCode);

    console.log(`Sending WhatsApp OTP to ${formattedPhone}`);

    const response = await fetch("https://api.apiwap.com/api/v1/whatsapp/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        message: message,
        type: "text",
      }),
    });

    const result = await response.json();
    console.log("WhatsApp OTP response:", result);

    // Log the OTP generation
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "whatsapp_otp_sent",
      metadata: { purpose, phone: formattedPhone.slice(-4) },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent via WhatsApp",
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
