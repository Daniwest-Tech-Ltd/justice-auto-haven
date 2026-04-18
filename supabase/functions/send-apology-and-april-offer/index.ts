import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency: only send once
    const { data: existing } = await supabase
      .from("audit_logs")
      .select("id")
      .eq("action", "apology_april_offer_sent")
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Apology email already sent. Skipping.", already_sent: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: customers, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .eq("account_status", "active");

    if (error) throw error;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    let emailsSent = 0;
    let emailsFailed = 0;

    const subject = "A Sincere Apology & Exclusive April Special Offer 🚗 — Justice Ultimate Automobiles";

    for (const customer of customers || []) {
      if (!customer.email) continue;
      try {
        await resend.emails.send({
          from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
          to: [customer.email],
          subject,
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;">
  <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">A Sincere Apology From Us 🙏</h1>
    <p style="color:#fecaca;margin:8px 0 0;font-size:13px;">Justice Ultimate Automobiles</p>
  </td></tr>
  <tr><td style="padding:32px 28px;">
    <p style="font-size:16px;color:#222;line-height:1.6;margin:0 0 16px;">Dear <strong>${customer.full_name || "Valued Customer"}</strong>,</p>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px;">
      We sincerely apologize for the recent <strong>holiday notification</strong> you received from us in error. 
      It was sent on the wrong date and did not reflect an actual public holiday. We deeply regret any confusion 
      this may have caused, and we are committed to keeping our communication accurate and respectful of your time.
    </p>
    <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 24px;">
      Thank you for your understanding and continued trust in <strong>Justice Ultimate Automobiles</strong>.
    </p>

    <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-left:5px solid #f59e0b;padding:20px;margin:24px 0;border-radius:6px;">
      <h2 style="margin:0 0 10px;color:#92400e;font-size:18px;">🎉 April Special Offer Sale 2026</h2>
      <p style="margin:0 0 10px;font-size:14px;color:#78350f;line-height:1.6;">
        To make it up to you, we are excited to share our <strong>April Special Offer</strong> on our latest collection of:
      </p>
      <ul style="margin:0 0 12px 18px;padding:0;font-size:14px;color:#78350f;line-height:1.8;">
        <li>🚗 Brand-new and luxury SUVs</li>
        <li>🚙 Premium sedans &amp; family cars</li>
        <li>🚘 Up to <strong>90% Asset Financing</strong> with fast 3-day approval</li>
        <li>💎 Exclusive April-only discounts on selected models</li>
      </ul>
      <p style="margin:8px 0 0;font-size:13px;color:#78350f;"><em>Limited-time offer — valid throughout April 2026.</em></p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://www.justiceultimateautomobiles.com/catalogue" style="background:#dc2626;color:#fff;padding:14px 34px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:15px;">View Our April Collection</a>
    </div>

    <p style="font-size:13px;color:#666;line-height:1.6;margin:20px 0 0;text-align:center;">
      <em>Trusted. Reliable. With you every step of the way.</em>
    </p>
  </td></tr>
  <tr><td style="background:#1f2937;padding:22px 28px;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;"><strong>Justice Ultimate Automobiles</strong></p>
    <p style="color:#9ca3af;font-size:12px;margin:0;">📞 0722 827 458 &nbsp;|&nbsp; 🌐 www.justiceultimateautomobiles.com</p>
    <p style="color:#6b7280;font-size:11px;margin:10px 0 0;">Westlands, Nairobi, Kenya</p>
  </td></tr>
</table>
</body></html>`,
        });
        emailsSent++;
      } catch (e) {
        emailsFailed++;
        console.error(`Failed to email ${customer.email}:`, e);
      }

      // In-app notification
      try {
        await supabase.from("notifications").insert({
          user_id: customer.user_id,
          title: "Apology & April Special Offer 🎉",
          message: "We apologize for the recent holiday notification sent in error. Enjoy our exclusive April Special Offer on our latest collection!",
          type: "announcement",
          metadata: { kind: "apology_april_offer" },
        });
      } catch (e) {
        console.error(`Failed notification for ${customer.user_id}:`, e);
      }

      await new Promise((r) => setTimeout(r, 80));
    }

    // Mark as sent — guarantees one-time delivery
    await supabase.from("audit_logs").insert({
      action: "apology_april_offer_sent",
      metadata: {
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        total_customers: customers?.length || 0,
        sent_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        total_customers: customers?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-apology-and-april-offer error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
