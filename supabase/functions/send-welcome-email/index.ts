import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  authProvider?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, authProvider = 'email' }: WelcomeEmailRequest = await req.json();

    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const providerLabel = authProvider === 'google' ? 'Google' : 
                          authProvider === 'github' ? 'GitHub' : 
                          authProvider === 'facebook' ? 'Facebook' : 'Email';

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
        to: [email],
        subject: "🎉 Welcome to Justice Ultimate Automobiles!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background: white;">
              <!-- Header with gradient -->
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🚗 Welcome to Justice Ultimate Automobiles!</h1>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 22px;">Hello ${name}! 👋</h2>
                
                <p style="color: #4b5563; line-height: 1.8; margin: 0 0 20px;">
                  Thank you for joining <strong>Justice Ultimate Automobiles</strong> via ${providerLabel}! 
                  We're thrilled to have you as part of our family of satisfied car enthusiasts.
                </p>
                
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                  <h3 style="color: #92400e; margin: 0 0 15px; font-size: 18px;">🎉 NEW YEAR MEGA SALE 2026!</h3>
                  <p style="color: #78350f; margin: 0; line-height: 1.6;">
                    Enjoy <strong>up to 90% asset financing</strong> with fast 3-day approvals. 
                    Start 2026 in your dream car!
                  </p>
                </div>
                
                <h3 style="color: #1f2937; margin: 25px 0 15px;">What You Can Do:</h3>
                <ul style="color: #4b5563; line-height: 2; padding-left: 20px;">
                  <li>🚗 Browse our premium car collection</li>
                  <li>💰 Apply for flexible asset financing</li>
                  <li>🔄 Submit your car for trade-in evaluation</li>
                  <li>📱 Book test drives and rentals</li>
                  <li>💬 Chat with our expert team</li>
                </ul>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="https://www.justiceultimateautomobiles.com/catalogue" 
                     style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Browse Cars Now →
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <!-- Contact Section -->
                <div style="background: #f9fafb; padding: 25px; border-radius: 12px;">
                  <h3 style="color: #374151; margin: 0 0 15px; font-size: 16px;">📍 Visit Our Showroom</h3>
                  <p style="color: #6b7280; margin: 0 0 10px; line-height: 1.6;">
                    <strong>Location:</strong> Westlands, Muthithi Road, Nairobi, Kenya<br>
                    <strong>Phone:</strong> <a href="tel:0722827458" style="color: #f59e0b;">0722827458</a><br>
                    <strong>Website:</strong> <a href="https://www.justiceultimateautomobiles.com" style="color: #f59e0b;">justiceultimateautomobiles.com</a>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #1f2937; padding: 25px 30px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                  © 2026 Justice Ultimate Automobiles. All rights reserved.
                </p>
                <p style="color: #6b7280; margin: 10px 0 0; font-size: 12px;">
                  Kenya's Most Trusted Car Dealership
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errorData);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    // Log to audit trail
    await supabase.from("audit_logs").insert({
      action: "welcome_email_sent",
      metadata: { email, name, authProvider }
    });

    console.log(`Welcome email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
