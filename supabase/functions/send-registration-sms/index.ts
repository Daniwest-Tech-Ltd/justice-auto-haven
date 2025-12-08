import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationSMSRequest {
  phone: string;
  customerName: string;
}

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

    const { phone, customerName }: RegistrationSMSRequest = await req.json();

    if (!phone || !customerName) {
      throw new Error("Phone and customerName are required");
    }

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

    if (settings && !settings.notify_on_registration) {
      return new Response(
        JSON.stringify({ success: false, message: "Registration SMS disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const senderName = settings?.sender_name || "JUA_AUTOS";

    const message = `Welcome to Justice Ultimate Automobiles, ${customerName}! Your account has been created successfully. Browse our cars at justiceultimateautomobiles.com. Call us: 0722827458`;

    console.log(`Sending registration SMS to ${formattedPhone}`);

    const { data: logEntry } = await supabase
      .from("sms_logs")
      .insert({
        phone: formattedPhone,
        message,
        sms_type: "registration",
        status: "pending",
      })
      .select()
      .single();

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
      throw new Error(brevoData.message || "Failed to send registration SMS");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Registration SMS sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Registration SMS error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
