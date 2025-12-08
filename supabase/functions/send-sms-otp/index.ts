import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  phone: string;
  userId: string;
  purpose?: string;
}

// Format phone number to 254XXXXXXXXX format
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.length !== 9) {
    throw new Error(`Invalid phone number length: ${cleaned.length} digits`);
  }
  return `254${cleaned}`;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_SMS_API_KEY");
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_SMS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone, userId, purpose = "login" }: OTPRequest = await req.json();

    if (!phone || !userId) {
      throw new Error("Phone and userId are required");
    }

    // Get SMS settings
    const { data: settings } = await supabase
      .from("sms_settings")
      .select("*")
      .single();

    if (settings && !settings.sms_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: "SMS is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const otp = generateOTP();
    const expiryMinutes = settings?.otp_expiry_minutes || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const senderName = settings?.sender_name || "JUA_AUTOS";

    // Save OTP to database
    const { error: otpError } = await supabase.from("user_otps").insert({
      user_id: userId,
      code: otp,
      purpose: purpose,
      expires_at: expiresAt.toISOString(),
    });

    if (otpError) {
      console.error("Failed to save OTP:", otpError);
      throw new Error("Failed to generate OTP");
    }

    const message = `Your Justice Ultimate Automobiles verification code is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code.`;

    console.log(`Sending SMS OTP to ${formattedPhone}`);

    // Log the SMS
    const { data: logEntry } = await supabase
      .from("sms_logs")
      .insert({
        phone: formattedPhone,
        message: `OTP: ${otp.substring(0, 2)}**** (hidden for security)`,
        sms_type: "otp",
        status: "pending",
      })
      .select()
      .single();

    // Send via Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "transactional",
        unicodeEnabled: true,
        sender: senderName,
        recipient: formattedPhone,
        content: message,
      }),
    });

    const brevoData = await brevoResponse.json();
    console.log("Brevo SMS OTP response:", brevoData);

    // Update log
    if (logEntry) {
      await supabase
        .from("sms_logs")
        .update({
          status: brevoResponse.ok ? "sent" : "failed",
          api_response: brevoData,
          error_message: brevoResponse.ok ? null : JSON.stringify(brevoData),
          sent_at: brevoResponse.ok ? new Date().toISOString() : null,
        })
        .eq("id", logEntry.id);
    }

    if (!brevoResponse.ok) {
      throw new Error(brevoData.message || "Failed to send SMS OTP");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent via SMS successfully",
        expiresAt: expiresAt.toISOString(),
        phone: formattedPhone
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("SMS OTP error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
