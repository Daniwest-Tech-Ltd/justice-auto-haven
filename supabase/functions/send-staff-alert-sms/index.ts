import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffAlertRequest {
  alertType: "new_order" | "new_lead" | "low_stock" | "urgent" | "general";
  message: string;
  staffPhones?: string[];
  sendToAdmin?: boolean;
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

    const { alertType, message, staffPhones = [], sendToAdmin = true }: StaffAlertRequest = await req.json();

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

    const senderName = settings?.sender_name || "JUA_AUTOS";
    const recipients: string[] = [];

    // Add admin phone if configured and sendToAdmin is true
    if (sendToAdmin && settings?.admin_phone) {
      try {
        recipients.push(formatPhoneNumber(settings.admin_phone));
      } catch (e) {
        console.warn("Invalid admin phone:", e);
      }
    }

    // Add staff phones
    for (const phone of staffPhones) {
      try {
        recipients.push(formatPhoneNumber(phone));
      } catch (e) {
        console.warn("Invalid staff phone:", e);
      }
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No valid recipients" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const alertPrefix = alertType === "urgent" ? "🚨 URGENT: " : 
                        alertType === "new_order" ? "📦 NEW ORDER: " :
                        alertType === "new_lead" ? "👤 NEW LEAD: " :
                        alertType === "low_stock" ? "⚠️ LOW STOCK: " : "";

    const fullMessage = `${alertPrefix}${message} - Justice Ultimate Automobiles`;

    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        console.log(`Sending staff alert to ${recipient}`);

        await supabase.from("sms_logs").insert({
          phone: recipient,
          message: fullMessage,
          sms_type: "staff_alert",
          status: "pending",
        });

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
            recipient: recipient,
            content: fullMessage,
          }),
        });

        if (brevoResponse.ok) {
          successCount++;
        } else {
          failCount++;
        }

        // Rate limit: wait 200ms between sends
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.error(`Failed to send to ${recipient}:`, e);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Staff alerts sent: ${successCount} success, ${failCount} failed`,
        successCount,
        failCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Staff alert SMS error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
