import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VERIFY_TOKEN = "justice_ultimate_token_2024";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Handle GET request - Webhook verification from Meta
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("Webhook verification request:", { mode, token, challenge });

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain", ...corsHeaders },
        });
      } else {
        console.error("Webhook verification failed - invalid token");
        return new Response("Forbidden", {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    // Handle POST request - Incoming WhatsApp messages
    if (req.method === "POST") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const body = await req.json();
      console.log("Incoming WhatsApp webhook data:", JSON.stringify(body, null, 2));

      // Extract message information if available
      let fromNumber = null;
      let messageType = null;
      let messageId = null;
      let timestamp = null;

      if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        fromNumber = message.from;
        messageType = message.type;
        messageId = message.id;
        timestamp = message.timestamp;
      }

      // Store webhook data in database
      const { error } = await supabase.from("whatsapp_webhook_logs").insert({
        message_data: body,
        from_number: fromNumber,
        message_type: messageType,
        message_id: messageId,
        timestamp: timestamp ? parseInt(timestamp) : null,
      });

      if (error) {
        console.error("Error storing webhook data:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store webhook data" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log("Webhook data stored successfully");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Method not allowed
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error("Error in whatsapp-webhook function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
