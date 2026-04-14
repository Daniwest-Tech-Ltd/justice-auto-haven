import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContentNotificationRequest {
  type: "blog" | "video";
  title: string;
  excerpt?: string;
  imageUrl?: string;
  contentUrl?: string;
  isUpdate?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContentNotificationRequest = await req.json();
    console.log("Content notification request:", data);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ADMIN_EMAILS = [
      'daniwesttechnologies@gmail.com',
      'justicevincentt@gmail.com'
    ];

    // Get all customer profiles
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("email, full_name, user_id, is_suspended")
      .not("email", "is", null);

    const { data: customerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    const customerUserIds = new Set(customerRoles?.map(r => r.user_id) || []);
    const customers = (allProfiles || []).filter(p => customerUserIds.has(p.user_id) && !p.is_suspended);

    // Build full recipient list with admins
    const allRecipients = [...customers];
    const adminProfiles = (allProfiles || []).filter(p => ADMIN_EMAILS.includes(p.email?.toLowerCase()));
    for (const admin of adminProfiles) {
      if (!allRecipients.find(c => c.email?.toLowerCase() === admin.email?.toLowerCase())) {
        allRecipients.push(admin);
      }
    }
    for (const adminEmail of ADMIN_EMAILS) {
      if (!allRecipients.find(c => c.email?.toLowerCase() === adminEmail.toLowerCase())) {
        allRecipients.push({ email: adminEmail, full_name: 'Admin', user_id: null, is_suspended: false });
      }
    }

    console.log(`Sending ${data.type} notification to ${allRecipients.length} recipients`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const resend = new Resend(resendApiKey);
    const actionText = data.isUpdate ? "Updated" : "New";
    const typeLabel = data.type === "blog" ? "Blog Post" : "Video";
    const emoji = data.type === "blog" ? "📝" : "🎥";
    const siteUrl = "https://www.justiceultimateautomobiles.com";
    const contentLink = data.contentUrl || (data.type === "blog" ? `${siteUrl}/blogs` : `${siteUrl}/videos`);

    let successCount = 0;
    let failCount = 0;

    for (const recipient of allRecipients) {
      if (!recipient.email) continue;
      try {
        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;text-align:center;">
          <h1 style="color:#f5c518;margin:0;font-size:28px;">⭐ Justice Ultimate Automobiles</h1>
          <p style="color:#fff;margin:10px 0 0;font-size:14px;">Premium Quality Vehicles in Kenya</p>
        </td></tr>
        <tr><td style="padding:20px;text-align:center;background:${data.type === 'blog' ? '#7c3aed' : '#dc2626'};">
          <span style="color:#fff;font-size:16px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">
            ${emoji} ${actionText} ${typeLabel}!
          </span>
        </td></tr>
        ${data.imageUrl ? `<tr><td style="padding:0;"><img src="${data.imageUrl}" alt="${data.title}" style="width:100%;height:250px;object-fit:cover;display:block;"></td></tr>` : ''}
        <tr><td style="padding:30px;">
          <h2 style="color:#1a1a2e;margin:0 0 15px;font-size:22px;text-align:center;">${data.title}</h2>
          ${data.excerpt ? `<p style="color:#666;font-size:14px;line-height:1.6;text-align:center;margin:0 0 25px;">${data.excerpt}</p>` : ''}
          <div style="text-align:center;margin:30px 0;">
            <a href="${contentLink}" style="display:inline-block;background:linear-gradient(135deg,#f5c518 0%,#e6b800 100%);color:#1a1a2e;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;text-transform:uppercase;">
              ${data.type === 'blog' ? 'Read Now →' : 'Watch Now →'}
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:20px;text-align:center;">
          <p style="color:#666;margin:0 0 10px;font-size:14px;">📞 Contact Us:</p>
          <p style="margin:5px 0;color:#1a1a2e;font-weight:bold;">Justice Vincent: 0722827458</p>
        </td></tr>
        <tr><td style="background:#1a1a2e;padding:20px;text-align:center;">
          <p style="color:#f5c518;margin:0 0 10px;font-size:14px;font-weight:bold;">🌐 www.justiceultimateautomobiles.com</p>
          <p style="color:#888;margin:0;font-size:12px;">© 2025 Justice Ultimate Automobiles. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        const { error } = await resend.emails.send({
          from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
          to: [recipient.email],
          subject: `${emoji} ${actionText} ${typeLabel}: ${data.title} — Justice Ultimate Automobiles`,
          html: emailHtml,
        });

        if (error) { failCount++; console.error(`Failed ${recipient.email}:`, error); }
        else { successCount++; }

        await new Promise(resolve => setTimeout(resolve, 550));
      } catch (err) {
        failCount++;
        console.error(`Error ${recipient.email}:`, err);
      }
    }

    // In-app notifications
    const notifs = allRecipients.filter(r => r.user_id).map(r => ({
      user_id: r.user_id,
      title: `${emoji} ${actionText} ${typeLabel}`,
      message: `${data.title}${data.excerpt ? ' - ' + data.excerpt.substring(0, 100) : ''}`,
      type: 'content_notification',
      is_read: false,
      metadata: { content_type: data.type, title: data.title, is_update: data.isUpdate || false }
    }));

    if (notifs.length > 0) {
      await supabase.from("notifications").insert(notifs);
    }

    await supabase.from("audit_logs").insert({
      action: `${data.type}_notification_sent`,
      metadata: { title: data.title, is_update: data.isUpdate, email_success: successCount, email_fail: failCount }
    });

    console.log(`Content notification: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-content-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
