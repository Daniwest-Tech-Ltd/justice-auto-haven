import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  phone: string;
  message: string;
  sms_type?: string;
}

// Format phone number to 254XXXXXXXXX format
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // Handle 254 prefix
  if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3);
  }
  
  // Ensure we have 9 digits
  if (cleaned.length !== 9) {
    throw new Error(`Invalid phone number length: ${cleaned.length} digits (expected 9)`);
  }
  
  return `254${cleaned}`;
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

    const { phone, message, sms_type = "general" }: SMSRequest = await req.json();

    if (!phone || !message) {
      throw new Error("Phone and message are required");
    }

    // Check if SMS is enabled
    const { data: settings } = await supabase
      .from("sms_settings")
      .select("*")
      .single();

    if (settings && !settings.sms_enabled) {
      console.log("SMS is disabled in settings");
      return new Response(
        JSON.stringify({ success: false, message: "SMS is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const senderName = settings?.sender_name || "JUA_AUTOS";

    console.log(`Sending SMS to ${formattedPhone}: ${message.substring(0, 50)}...`);

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from("sms_logs")
      .insert({
        phone: formattedPhone,
        message,
        sms_type,
        status: "pending",
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create SMS log:", logError);
    }

    // Send SMS via Brevo API
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
    console.log("Brevo API response:", brevoData);

    // Update log with result
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
      throw new Error(brevoData.message || "Failed to send SMS");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "SMS sent successfully",
        messageId: brevoData.messageId,
        phone: formattedPhone
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("SMS sending error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
