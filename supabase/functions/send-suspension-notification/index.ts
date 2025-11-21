import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuspensionNotificationRequest {
  email: string;
  name: string;
  reason: string;
  isBlocked?: boolean;
  activationCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, reason, isBlocked = false }: SuspensionNotificationRequest = await req.json();

    const statusTitle = isBlocked ? "Account Blocked" : "Account Suspended";
    const statusIcon = isBlocked ? "🚫" : "⚠️";
    
    const nextStepsContent = isBlocked 
      ? `
        <h3>What You Need to Do:</h3>
        <ol style="margin: 20px 0; padding-left: 20px;">
          <li><strong>Contact Administrator:</strong> Visit our website and use the chatbot to reach out to our support team.</li>
          <li><strong>Send a Message:</strong> You can also send a direct message to our admin team when you attempt to log in.</li>
          <li><strong>Provide Context:</strong> Explain your situation and our team will review your account.</li>
          <li><strong>Wait for Response:</strong> Our administrators will provide you with an activation code to restore your account.</li>
        </ol>
        <p><strong>⚠️ IMPORTANT:</strong> Your account is currently blocked and requires administrator approval to be reactivated. This may lead to permanent deletion if not addressed promptly.</p>
      `
      : `
        <h3>What Happens Next:</h3>
        <ol style="margin: 20px 0; padding-left: 20px;">
          <li><strong>Suspension Duration:</strong> Your account is temporarily suspended for 1 hour.</li>
          <li><strong>Auto-Reactivation:</strong> After 1 hour, you can attempt to log in again.</li>
          <li><strong>Contact Support:</strong> If you need immediate access, contact our support team through the chatbot on our website.</li>
          <li><strong>Activation Code:</strong> Our administrators can provide you with an activation code to restore your account immediately.</li>
        </ol>
        <p><strong>⚠️ WARNING:</strong> If you attempt to log in with incorrect credentials again after this suspension expires, your account will be permanently blocked and require administrator intervention.</p>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 30px; background: white; }
            .alert-box { background: #fef2f2; border-left: 5px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .alert-box p { margin: 8px 0; }
            .info-box { background: #eff6ff; border-left: 5px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            ol { line-height: 1.8; }
            ol li { margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusIcon} ${statusTitle}</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <div class="alert-box">
                <p><strong>Your account has been ${isBlocked ? 'blocked' : 'suspended'}.</strong></p>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              
              ${nextStepsContent}
              
              <div class="info-box">
                <p><strong>💬 Need Help?</strong></p>
                <p>Visit our website at <a href="https://justiceultimateautomobiles.com" style="color: #3b82f6;">justiceultimateautomobiles.com</a> and use our live chatbot to contact support immediately.</p>
                <p>Alternatively, when you try to log in, you'll see an option to send a message directly to our administrators.</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you believe this ${isBlocked ? 'block' : 'suspension'} was made in error, please reach out to us immediately. We're here to help resolve any issues with your account.</p>
            </div>
            <div class="footer">
              <p><strong>Justice Ultimate Automobiles</strong></p>
              <p>📍 Nairobi, Kenya | 📞 +254 722 827 458</p>
              <p style="margin-top: 15px; font-size: 12px;">This is an automated security notification. Please do not reply to this email directly.</p>
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
        subject: `${statusIcon} ${statusTitle} - Action Required`,
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
