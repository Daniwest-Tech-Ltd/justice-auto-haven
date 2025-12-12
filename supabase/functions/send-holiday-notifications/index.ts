import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HolidayData {
  name: string;
  message: string;
  emoji: string;
  formattedDate: string;
}

const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
  return '254' + cleaned;
};

const validatePhone = (phone: string): boolean => {
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
  return cleaned.length === 9;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { holiday }: { holiday: HolidayData } = await req.json();

    if (!holiday) {
      return new Response(
        JSON.stringify({ error: "Holiday data is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active customers with phone and email
    const { data: customers, error: customersError } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, phone, country_code")
      .eq("account_status", "active");

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      throw customersError;
    }

    console.log(`Found ${customers?.length || 0} customers to notify`);

    let emailsSent = 0;
    let smsSent = 0;
    let whatsappSent = 0;

    // Initialize Resend for emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Process each customer
    for (const customer of customers || []) {
      // 1. Send Email Notification
      if (resend && customer.email) {
        try {
          await resend.emails.send({
            from: "Justice Ultimate Automobiles <onboarding@resend.dev>",
            to: [customer.email],
            subject: `${holiday.emoji} Happy ${holiday.name}! — Justice Ultimate Automobiles`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${holiday.emoji} Happy ${holiday.name}! ${holiday.emoji}</h1>
                      <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">${holiday.formattedDate}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                        Dear <strong>${customer.full_name}</strong>,
                      </p>
                      <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                        ${holiday.message}
                      </p>
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                          🎉 <strong>Exclusive Holiday Offers!</strong><br>
                          Celebrate this special day with amazing deals on luxury SUVs, sedans, and all car levels at Justice Ultimate Automobiles!
                        </p>
                      </div>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.justiceultimateautomobiles.com/catalogue" style="background: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                          View Holiday Offers
                        </a>
                      </div>
                      <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 20px 0 0 0;">
                        Trusted. Reliable. With you every step of the way.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: #1f2937; padding: 25px 30px; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                        Justice Ultimate Automobiles
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        📞 0722827458 | 🌐 www.justiceultimateautomobiles.com
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });
          emailsSent++;
          console.log(`Email sent to ${customer.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${customer.email}:`, emailError);
        }
      }

      // 2. Send SMS Notification
      const brevoApiKey = Deno.env.get("BREVO_SMS_API_KEY");
      if (brevoApiKey && customer.phone && validatePhone(customer.phone)) {
        try {
          const formattedPhone = formatPhoneNumber(customer.phone);
          const smsMessage = `${holiday.emoji} Happy ${holiday.name}! ${holiday.message} Exclusive holiday offers at Justice Ultimate Automobiles! Visit www.justiceultimateautomobiles.com — 0722827458`;
          
          const smsResponse = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": brevoApiKey,
            },
            body: JSON.stringify({
              sender: "JUSTICE",
              recipient: formattedPhone,
              content: smsMessage.substring(0, 160), // SMS limit
              type: "transactional",
            }),
          });

          if (smsResponse.ok) {
            smsSent++;
            console.log(`SMS sent to ${formattedPhone}`);
          }
        } catch (smsError) {
          console.error(`Failed to send SMS to ${customer.phone}:`, smsError);
        }
      }

      // 3. Send WhatsApp Notification
      const whatsappApiKey = Deno.env.get("APIWAP_API_KEY");
      if (whatsappApiKey && customer.phone && validatePhone(customer.phone)) {
        try {
          const countryCode = customer.country_code || "+254";
          let phoneNumber = customer.phone.replace(/\D/g, '');
          if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.substring(1);
          if (phoneNumber.startsWith('254')) phoneNumber = phoneNumber.substring(3);
          const formattedPhone = `${countryCode}${phoneNumber}`;

          const whatsappMessage = `${holiday.emoji} *Happy ${holiday.name}!*

${holiday.message}

🎉 *Exclusive Holiday Offers at Justice Ultimate Automobiles!*

Celebrate with amazing deals on:
🚗 Luxury SUVs
🚙 Premium Sedans
🚘 All Car Levels

Visit: www.justiceultimateautomobiles.com
📞 Call: 0722827458

_Trusted. Reliable. With you every step of the way._`;

          const whatsappResponse = await fetch("https://api.apiwap.com/api/v1/whatsapp/send-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${whatsappApiKey}`,
            },
            body: JSON.stringify({
              phoneNumber: formattedPhone,
              message: whatsappMessage,
              type: "text",
            }),
          });

          if (whatsappResponse.ok) {
            whatsappSent++;
            console.log(`WhatsApp sent to ${formattedPhone}`);
          }
        } catch (whatsappError) {
          console.error(`Failed to send WhatsApp to ${customer.phone}:`, whatsappError);
        }
      }

      // Create in-app notification
      try {
        await supabase.from("notifications").insert({
          user_id: customer.user_id,
          title: `${holiday.emoji} Happy ${holiday.name}!`,
          message: `${holiday.message} Check out our exclusive holiday offers!`,
          type: "holiday",
          metadata: { holiday_name: holiday.name, date: holiday.formattedDate }
        });
      } catch (notifError) {
        console.error(`Failed to create notification for ${customer.user_id}:`, notifError);
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Log the notification event
    await supabase.from("audit_logs").insert({
      action: "holiday_notifications_sent",
      metadata: {
        holiday_name: holiday.name,
        date: holiday.formattedDate,
        emails_sent: emailsSent,
        sms_sent: smsSent,
        whatsapp_sent: whatsappSent,
        total_customers: customers?.length || 0,
      },
    });

    console.log(`Holiday notifications completed: ${emailsSent} emails, ${smsSent} SMS, ${whatsappSent} WhatsApp`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Holiday notifications sent`,
        stats: {
          emails_sent: emailsSent,
          sms_sent: smsSent,
          whatsapp_sent: whatsappSent,
          total_customers: customers?.length || 0,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-holiday-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
