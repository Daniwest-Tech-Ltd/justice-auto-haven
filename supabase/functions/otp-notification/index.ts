import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      userId, 
      code, 
      action, 
      expiresIn 
    } = await req.json();

    if (!email || !userId || !action) {
      throw new Error("Missing required fields: email, userId, action");
    }

    console.log(`Sending OTP ${action} notification to ${email}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    const userName = profile?.full_name || "User";

    // Prepare email content based on action
    let subject = "";
    let htmlContent = "";

    switch (action) {
      case "generated":
        subject = "Your 2FA Verification Code";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Two-Factor Authentication</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">Hello ${userName},</p>
              <p style="font-size: 14px; color: #6b7280;">Your verification code is:</p>
              <div style="background: white; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; border: 2px solid #e5e7eb;">
                ${code || "******"}
              </div>
              <p style="font-size: 14px; color: #6b7280;">This code will expire in ${expiresIn || "10 minutes"}.</p>
              <p style="font-size: 14px; color: #ef4444; margin-top: 20px;">⚠️ If you didn't request this code, please ignore this email and ensure your account is secure.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
              <p>Justice Ultimate Automobiles - Security Team</p>
            </div>
          </div>
        `;
        break;

      case "verified":
        subject = "2FA Verification Successful";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">✓ Verification Successful</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">Hello ${userName},</p>
              <p style="font-size: 14px; color: #6b7280;">Your two-factor authentication code was successfully verified.</p>
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #065f46; font-weight: 600;">✓ Authentication Successful</p>
                <p style="margin: 5px 0 0 0; color: #047857; font-size: 13px;">Time: ${new Date().toLocaleString()}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">If this wasn't you, please contact our security team immediately.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
              <p>Justice Ultimate Automobiles - Security Team</p>
            </div>
          </div>
        `;
        break;

      case "expired":
        subject = "Your 2FA Code Has Expired";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">⏰ Code Expired</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">Hello ${userName},</p>
              <p style="font-size: 14px; color: #6b7280;">Your two-factor authentication code has expired.</p>
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-weight: 600;">Code Expired</p>
                <p style="margin: 5px 0 0 0; color: #b45309; font-size: 13px;">Please request a new code to continue.</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">You can request a new verification code from the login page.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
              <p>Justice Ultimate Automobiles - Security Team</p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Justice Ultimate Automobiles <security@justiceultimateautomobiles.com>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", emailResponse.status, errorData);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    // Log notification in audit trail
    const { error: auditError } = await supabase
      .from("otp_audit_trail")
      .insert({
        user_id: userId,
        action: action,
        performed_by: userId,
        metadata: {
          notification_sent: true,
          email: email,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error("Error logging audit:", auditError);
    }

    console.log(`Notification sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("OTP notification error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
