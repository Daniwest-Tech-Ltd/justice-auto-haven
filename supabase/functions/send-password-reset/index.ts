import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  email: string;
  redirectTo: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: ResetRequest = await req.json();
    console.log("Password reset requested for:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase admin client (bypasses captcha)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate password reset link using admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    // For security, always return success even if user doesn't exist
    // This prevents user enumeration attacks
    if (error) {
      console.log("User not found or error (silent):", error.message);
      // Return success anyway - don't reveal if email exists
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a password reset link has been sent." }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Reset link generated successfully for:", email);
    console.log("Link data available:", !!data?.properties?.action_link);

    // Send email using Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    console.log("RESEND_API_KEY available:", !!RESEND_API_KEY);
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured!");
      return new Response(
        JSON.stringify({ success: true, message: "Password reset link generated but email service not configured." }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (data?.properties?.action_link) {
      const resetLink = data.properties.action_link;
      console.log("Sending email via Resend to:", email);
      
      const emailBody = {
        from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
        to: [email],
        subject: "Reset Your Password – Justice Ultimate Automobiles",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
                    🔐 Password Reset Request
                  </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Hello,
                  </p>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    We received a request to reset the password for your account at <strong>Justice Ultimate Automobiles</strong>.
                  </p>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Click the button below to create a new password:
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);">
                      Reset Password
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                    If you did not request this password reset, you can safely ignore this email. Your password will not be changed.
                  </p>
                  
                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    This link will expire in 1 hour for security purposes.
                  </p>
                  
                  <p style="color: #999; font-size: 11px; margin-top: 15px; word-break: break-all;">
                    If the button doesn't work, copy and paste this link: ${resetLink}
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: #f8f8f8; padding: 25px 30px; border-top: 1px solid #eee;">
                  <div style="text-align: center;">
                    <p style="color: #dc2626; font-weight: bold; margin: 0 0 10px 0; font-size: 16px;">
                      Justice Ultimate Automobiles
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">
                      📞 0722827458 | 0751555544
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 0;">
                      🌐 <a href="https://www.justiceultimateautomobiles.com" style="color: #dc2626; text-decoration: none;">www.justiceultimateautomobiles.com</a>
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Bottom Note -->
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </body>
          </html>
        `,
      };

      console.log("Email body prepared, calling Resend API...");

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailBody),
      });

      const emailResult = await emailResponse.text();
      console.log("Resend API response status:", emailResponse.status);
      console.log("Resend API response:", emailResult);

      if (!emailResponse.ok) {
        console.error("Failed to send email via Resend:", emailResult);
        // Still return success - the link was generated
        return new Response(
          JSON.stringify({ success: true, message: "Password reset link generated. Email delivery may be delayed.", emailError: emailResult }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log("Password reset email sent successfully to:", email);
    } else {
      console.error("No action_link in response data");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent successfully" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
