import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hard-wired admin recipients (always notified + emailed)
const ADMINS = [
  { user_id: "9d0ed5b9-2ff7-48fe-b358-fa24f7ef26b4", email: "maishdan4940@gmail.com" },
  { user_id: "5b59e221-0500-4bd7-8aa9-8634f976f3c4", email: "justicevincentt@gmail.com" },
];

interface Payload {
  kind: "message" | "order";
  title: string;
  message: string;
  details?: Record<string, unknown>;
}

const rows = (details?: Record<string, unknown>) =>
  Object.entries(details ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;text-transform:capitalize;">${k.replace(
          /_/g,
          " "
        )}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;">${String(
          v
        )}</td></tr>`
    )
    .join("");

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: Payload = await req.json();
    const kind = body.kind === "order" ? "order" : "message";
    const title = (body.title || "").slice(0, 200) || (kind === "order" ? "New Order" : "New Message");
    const message = (body.message || "").slice(0, 1000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. In-app notifications for both admins
    const { error: notifError } = await supabase.from("notifications").insert(
      ADMINS.map((a) => ({
        user_id: a.user_id,
        type: kind,
        title,
        message,
        metadata: body.details ?? {},
      }))
    );
    if (notifError) console.error("notification insert error", notifError);

    // 2. Email both admins
    const accent = kind === "order" ? "#0f766e" : "#1e40af";
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:${accent};padding:20px;border-radius:10px 10px 0 0;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">${kind === "order" ? "🛒 New Order Received" : "✉️ New Customer Message"}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:24px;background:#ffffff;">
          <p style="font-size:16px;color:#111827;font-weight:700;margin:0 0 8px;">${title}</p>
          <p style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;margin:0 0 16px;">${message}</p>
          ${body.details ? `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;">${rows(body.details)}</table>` : ""}
          <p style="font-size:13px;color:#6b7280;margin-top:20px;">Sign in to the admin dashboard to respond.</p>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
          Justice Ultimate Automobiles — Admin Alerts<br/>Trusted. Reliable. With you every step of the way.
        </p>
      </div>`;

    let emailResult: unknown = null;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
          to: ADMINS.map((a) => a.email),
          subject: `${kind === "order" ? "[ORDER]" : "[MESSAGE]"} ${title}`,
          html,
        }),
      });
      emailResult = await res.json();
      console.log("admin alert email", emailResult);
    } else {
      console.warn("RESEND_API_KEY missing — email skipped");
    }

    return new Response(JSON.stringify({ success: true, email: emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("notify-admin-alert error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
