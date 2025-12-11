import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordChangeRequest {
  email: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: PasswordChangeRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no API key" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const currentDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - Justice Ultimate Automobiles</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                      🔐 Password Changed Successfully
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">
                      Hello <strong>${userName || 'Valued Customer'}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                      Your password for your account at <strong>Justice Ultimate Automobiles</strong> was successfully changed.
                    </p>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; font-size: 14px; color: #92400e;">
                        <strong>⚠️ Security Notice:</strong><br>
                        If you did not make this change, please contact our support team immediately.
                      </p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                      <tr>
                        <td style="padding: 12px 15px; background-color: #f9fafb; border-radius: 8px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280;">
                            <strong>Date & Time:</strong><br>
                            ${currentDate}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 25px 0 0 0; font-size: 16px; color: #333333;">
                      You can now log in with your new password.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://www.justiceultimateautomobiles.com/auth" 
                         style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Login to Your Account
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1f2937; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #ffffff;">
                      Justice Ultimate Automobiles
                    </p>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #9ca3af;">
                      📞 0722 827 458 | 0701 460 110
                    </p>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #9ca3af;">
                      📧 info@justiceultimateautomobiles.com
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #9ca3af;">
                      🌐 www.justiceultimateautomobiles.com
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                      © ${new Date().getFullYear()} Justice Ultimate Automobiles. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Justice Ultimate Automobiles <onboarding@resend.dev>",
        to: [email],
        subject: "🔐 Your Password Has Been Changed - Justice Ultimate Automobiles",
        html: emailHtml,
      }),
    });

    const data = await res.json();
    console.log("Password change notification sent:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending password change notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
