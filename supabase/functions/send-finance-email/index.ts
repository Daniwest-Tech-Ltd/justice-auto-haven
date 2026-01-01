import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
  applicationId: string;
  status: string;
  recipientEmail: string;
  recipientName: string;
  vehicleName?: string;
  financeAmount?: number;
}

const getEmailContent = (status: string, recipientName: string, vehicleName?: string, financeAmount?: number) => {
  const formattedAmount = financeAmount ? `KES ${financeAmount.toLocaleString()}` : "";
  
  switch (status) {
    case "pending":
      return {
        subject: "Asset Finance Application Received – Justice Ultimate Automobiles",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">🚗 Application Received</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${recipientName}</strong>,</p>
              <p>Thank you for submitting your asset finance application with <strong>Justice Ultimate Automobiles</strong>.</p>
              ${vehicleName ? `<p>Vehicle: <strong>${vehicleName}</strong></p>` : ""}
              ${formattedAmount ? `<p>Finance Amount: <strong>${formattedAmount}</strong></p>` : ""}
              <p>Your application is now <strong>under review</strong>. We will respond within <strong>3 working days</strong>.</p>
              <p style="margin-top: 20px;">If you have any questions, please contact us:</p>
              <p>📞 Phone: <a href="tel:+254751555544">0751 555 544</a></p>
              <p>📧 Email: <a href="mailto:info@justiceultimateautomobiles.com">info@justiceultimateautomobiles.com</a></p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Justice Ultimate Automobiles Team</strong></p>
            </div>
          </div>
        `,
      };
    case "under_review":
      return {
        subject: "Your Application is Under Review – Justice Ultimate Automobiles",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">📋 Under Review</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${recipientName}</strong>,</p>
              <p>Your asset finance application is currently <strong>under review</strong> by our finance team.</p>
              ${vehicleName ? `<p>Vehicle: <strong>${vehicleName}</strong></p>` : ""}
              ${formattedAmount ? `<p>Finance Amount: <strong>${formattedAmount}</strong></p>` : ""}
              <p>We are verifying your documents and assessing your application. You will receive an update shortly.</p>
              <p style="margin-top: 20px;">Thank you for your patience.</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Justice Ultimate Automobiles Team</strong></p>
            </div>
          </div>
        `,
      };
    case "approved":
      return {
        subject: "🎉 Congratulations! Your Finance Application is Approved – Justice Ultimate Automobiles",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">🎉 Application Approved!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${recipientName}</strong>,</p>
              <p>Congratulations! Your asset finance application has been <strong style="color: #16a34a;">APPROVED</strong>.</p>
              ${vehicleName ? `<p>Vehicle: <strong>${vehicleName}</strong></p>` : ""}
              ${formattedAmount ? `<p>Approved Finance Amount: <strong>${formattedAmount}</strong></p>` : ""}
              <p>Our team will contact you shortly to complete the next steps and arrange vehicle delivery.</p>
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Next Steps:</strong></p>
                <ol style="margin: 10px 0;">
                  <li>Our finance partner will contact you</li>
                  <li>Complete final documentation</li>
                  <li>Make deposit payment</li>
                  <li>Collect your new vehicle!</li>
                </ol>
              </div>
              <p>📞 Contact us: <a href="tel:+254751555544">0751 555 544</a></p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Justice Ultimate Automobiles Team</strong></p>
            </div>
          </div>
        `,
      };
    case "rejected":
      return {
        subject: "Asset Finance Application Update – Justice Ultimate Automobiles",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6b7280, #4b5563); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">Application Update</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${recipientName}</strong>,</p>
              <p>Thank you for your interest in asset financing with Justice Ultimate Automobiles.</p>
              <p>After careful review, we regret to inform you that your application was not successful at this time.</p>
              <p>This decision may be due to various factors, and we encourage you to:</p>
              <ul>
                <li>Review your credit history</li>
                <li>Consider a higher deposit amount</li>
                <li>Reapply after 3-6 months</li>
              </ul>
              <p>If you have any questions or would like to explore other options, please contact us:</p>
              <p>📞 Phone: <a href="tel:+254751555544">0751 555 544</a></p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Justice Ultimate Automobiles Team</strong></p>
            </div>
          </div>
        `,
      };
    default:
      return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, status, recipientEmail, recipientName, vehicleName, financeAmount }: EmailRequest = await req.json();

    if (!applicationId || !status || !recipientEmail || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailContent = getEmailContent(status, recipientName, vehicleName, financeAmount);
    if (!emailContent) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.body,
      }),
    });

    const emailResult = await emailResponse.json();

    // Log email in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("email_logs").insert({
      application_id: applicationId,
      email_type: `finance_${status}`,
      recipient: recipientEmail,
      subject: emailContent.subject,
      body: emailContent.body,
      status: emailResponse.ok ? "sent" : "failed",
    });

    console.log(`Email sent to ${recipientEmail} for status: ${status}`);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
