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
      
      // Professional, trustworthy email template
      const emailBody = {
        from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
        to: [email],
        subject: "Password Reset - Justice Ultimate Automobiles",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - Justice Ultimate Automobiles</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; line-height: 1.6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Company Branding -->
                    <tr>
                      <td style="background-color: #b91c1c; padding: 30px 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                          JUSTICE ULTIMATE AUTOMOBILES
                        </h1>
                        <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">
                          Your Trusted Car Dealership in Kenya
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: bold;">
                          Password Reset Request
                        </h2>
                        
                        <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
                          Hello,
                        </p>
                        
                        <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px;">
                          We received a request to reset your password for your <strong>Justice Ultimate Automobiles</strong> account. If you made this request, please click the button below to set a new password.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${resetLink}" style="display: inline-block; background-color: #b91c1c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                                Reset My Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Security Notice -->
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 4px;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: bold;">
                            Security Notice:
                          </p>
                          <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px;">
                            This link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email or contact our support team if you have concerns.
                          </p>
                        </div>
                        
                        <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px;">
                          <strong>Did not request this?</strong> You can safely ignore this email. Your password will not be changed unless you click the link above.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="text-align: center;">
                              <p style="color: #b91c1c; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                                Justice Ultimate Automobiles
                              </p>
                              <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">
                                Phone: 0722827458 | 0751555544
                              </p>
                              <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px;">
                                Website: <a href="https://www.justiceultimateautomobiles.com" style="color: #b91c1c; text-decoration: none;">www.justiceultimateautomobiles.com</a>
                              </p>
                              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                This is an automated email from Justice Ultimate Automobiles.<br>
                                Please do not reply directly to this email.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                  </table>
                  
                  <!-- Additional Trust Footer -->
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr>
                      <td style="text-align: center; padding: 0 40px;">
                        <p style="color: #9ca3af; margin: 0; font-size: 11px;">
                          This email was sent by Justice Ultimate Automobiles, a registered car dealership in Nairobi, Kenya.<br>
                          If you have any questions, please contact us at 0722827458.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
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
