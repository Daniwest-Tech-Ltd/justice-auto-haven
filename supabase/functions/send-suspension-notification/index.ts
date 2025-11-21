import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuspensionNotificationRequest {
  email: string;
  name: string;
  reason: string;
  activationCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, reason, activationCode }: SuspensionNotificationRequest = await req.json();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .code-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Suspended</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <div class="alert-box">
                <p><strong>Your account has been suspended.</strong></p>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              <p><strong>⚠️ WARNING:</strong> Your account may be permanently deleted if not reactivated soon.</p>
              <p>To regain access to your account, please contact our support team immediately through the chatbot on our website or by replying to this email.</p>
              <p>Our team will review your case and assist you with the reactivation process.</p>
              <p>If you believe this suspension was made in error, please reach out to us immediately.</p>
              <div class="footer">
                <p>Justice Ultimate Automobiles</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
        to: [email],
        subject: "⚠️ Account Suspension Notice",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending suspension notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
