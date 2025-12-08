import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderSMSRequest {
  orderId: string;
  customerPhone: string;
  customerName: string;
  orderType: "purchase" | "rental" | "trade-in";
  carDetails?: string;
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

    const { orderId, customerPhone, customerName, orderType, carDetails }: OrderSMSRequest = await req.json();

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

    if (settings && !settings.notify_on_new_order) {
      return new Response(
        JSON.stringify({ success: false, message: "Order notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhoneNumber(customerPhone);
    const senderName = settings?.sender_name || "JUA_AUTOS";

    // Customer message
    let customerMessage = "";
    switch (orderType) {
      case "purchase":
        customerMessage = `Hi ${customerName}! Thank you for your order with Justice Ultimate Automobiles. Order #${orderId.substring(0, 8).toUpperCase()} has been received. ${carDetails ? `Vehicle: ${carDetails}. ` : ""}We'll contact you shortly. Call: 0722827458`;
        break;
      case "rental":
        customerMessage = `Hi ${customerName}! Your rental booking #${orderId.substring(0, 8).toUpperCase()} with Justice Ultimate Automobiles is confirmed. ${carDetails ? `Vehicle: ${carDetails}. ` : ""}We'll contact you shortly. Call: 0722827458`;
        break;
      case "trade-in":
        customerMessage = `Hi ${customerName}! Your trade-in request #${orderId.substring(0, 8).toUpperCase()} with Justice Ultimate Automobiles has been received. Our team will evaluate and contact you soon. Call: 0722827458`;
        break;
    }

    // Send to customer
    console.log(`Sending order SMS to customer ${formattedPhone}`);

    const { data: logEntry } = await supabase
      .from("sms_logs")
      .insert({
        phone: formattedPhone,
        message: customerMessage,
        sms_type: "order_confirmation",
        status: "pending",
      })
      .select()
      .single();

    const customerResponse = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
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
        content: customerMessage,
      }),
    });

    const customerData = await customerResponse.json();

    if (logEntry) {
      await supabase
        .from("sms_logs")
        .update({
          status: customerResponse.ok ? "sent" : "failed",
          api_response: customerData,
          error_message: customerResponse.ok ? null : JSON.stringify(customerData),
          sent_at: customerResponse.ok ? new Date().toISOString() : null,
        })
        .eq("id", logEntry.id);
    }

    // Send to admin if configured
    if (settings?.admin_phone) {
      const adminPhone = formatPhoneNumber(settings.admin_phone);
      const adminMessage = `New ${orderType} order! Order #${orderId.substring(0, 8).toUpperCase()} from ${customerName} (${formattedPhone}). ${carDetails || ""}. Check dashboard.`;

      await supabase.from("sms_logs").insert({
        phone: adminPhone,
        message: adminMessage,
        sms_type: "admin_alert",
        status: "pending",
      });

      await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
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
          recipient: adminPhone,
          content: adminMessage,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order SMS sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Order SMS error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
