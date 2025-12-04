import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  phoneNumber: string;
  message: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, message }: WhatsAppRequest = await req.json();
    
    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: "Phone number and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const apiKey = Deno.env.get("APIWAP_API_KEY");
    if (!apiKey) {
      console.error("APIWAP_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "WhatsApp API not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format phone number (ensure it starts with +254 for Kenya)
    let formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/-/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    console.log(`Sending WhatsApp message to ${formattedPhone}`);

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
    console.log("APIWAP response:", result);

    if (!response.ok) {
      console.error("WhatsApp API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send WhatsApp message", details: result }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
