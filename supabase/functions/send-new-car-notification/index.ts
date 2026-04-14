import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CarNotificationRequest {
  carId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  stockId: string;
  imageUrl?: string;
  isUpdate?: boolean;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const carData: CarNotificationRequest = await req.json();
    console.log("Received car notification request:", carData);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Format price in KSh
    const formattedPrice = new Intl.NumberFormat("en-KE").format(carData.price);
    const actionText = carData.isUpdate ? "UPDATED" : "NEW ARRIVAL";
    const carTitle = `${carData.year} ${carData.make} ${carData.model}`;
    const carLink = `https://www.justiceultimateautomobiles.com/cars/${carData.carId}`;

    // Admin emails that must always receive notifications
    const ADMIN_EMAILS = [
      'daniwesttechnologies@gmail.com',
      'justicevincentt@gmail.com'
    ];

    // Get all customer profiles with emails
    const { data: allProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name, user_id, phone, country_code, is_suspended")
      .not("email", "is", null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all users with customer role
    const { data: customerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    const customerUserIds = new Set(customerRoles?.map(r => r.user_id) || []);

    // Filter to active customers
    const customers = (allProfiles || []).filter(p => 
      customerUserIds.has(p.user_id) && !p.is_suspended
    );

    // Add admin emails to recipient list (ensure admins always get notified)
    const adminProfiles = (allProfiles || []).filter(p => 
      ADMIN_EMAILS.includes(p.email?.toLowerCase())
    );
    
    // Combine customers and admin profiles, removing duplicates
    const allRecipients = [...customers];
    for (const admin of adminProfiles) {
      if (!allRecipients.find(c => c.email?.toLowerCase() === admin.email?.toLowerCase())) {
        allRecipients.push(admin);
      }
    }
    
    // Also ensure admin emails are in the list even if they don't have profiles
    for (const adminEmail of ADMIN_EMAILS) {
      if (!allRecipients.find(c => c.email?.toLowerCase() === adminEmail.toLowerCase())) {
        allRecipients.push({ 
          email: adminEmail, 
          full_name: 'Admin', 
          user_id: null, 
          phone: null, 
          country_code: null,
          is_suspended: false 
        });
      }
    }

    console.log(`Found ${allRecipients.length} recipients to notify (${customers.length} customers + admins)`);

    let emailSuccessCount = 0;
    let emailFailCount = 0;
    let whatsappSuccessCount = 0;
    let whatsappFailCount = 0;
    let notificationCount = 0;

    // ============ SEND EMAILS VIA RESEND ============
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      for (const recipient of allRecipients) {
        if (!recipient.email) continue;

        try {
          // Professional HTML email template
          const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actionText} - ${carTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #f5c518; margin: 0; font-size: 28px; font-weight: bold;">
                ⭐ Justice Ultimate Automobiles
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">
                Premium Quality Vehicles in Kenya
              </p>
            </td>
          </tr>

          <!-- Action Badge -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: ${carData.isUpdate ? '#2196F3' : '#4CAF50'};">
              <span style="color: #ffffff; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                🚗 ${actionText}!
              </span>
            </td>
          </tr>

          <!-- Car Image -->
          ${carData.imageUrl ? `
          <tr>
            <td style="padding: 0;">
              <img src="${carData.imageUrl}" alt="${carTitle}" style="width: 100%; height: 300px; object-fit: cover; display: block;">
            </td>
          </tr>
          ` : ''}

          <!-- Car Details -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
                ${carTitle}
              </h2>

              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <strong style="color: #666;">Stock ID:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right; color: #1a1a2e;">
                      ${carData.stockId}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <strong style="color: #666;">Price:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right; color: #4CAF50; font-weight: bold; font-size: 18px;">
                      KSh ${formattedPrice}
                    </td>
                  </tr>
                  ${carData.color ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <strong style="color: #666;">Color:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right; color: #1a1a2e;">
                      ${carData.color}
                    </td>
                  </tr>
                  ` : ''}
                  ${carData.fuelType ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <strong style="color: #666;">Fuel Type:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right; color: #1a1a2e;">
                      ${carData.fuelType}
                    </td>
                  </tr>
                  ` : ''}
                  ${carData.transmission ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <strong style="color: #666;">Transmission:</strong>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right; color: #1a1a2e;">
                      ${carData.transmission}
                    </td>
                  </tr>
                  ` : ''}
                  ${carData.mileage ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #666;">Mileage:</strong>
                    </td>
                    <td style="padding: 8px 0; text-align: right; color: #1a1a2e;">
                      ${carData.mileage}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${carLink}" style="display: inline-block; background: linear-gradient(135deg, #f5c518 0%, #e6b800 100%); color: #1a1a2e; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                  View Full Details →
                </a>
              </div>

              <!-- Features -->
              <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; background-color: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 20px; margin: 5px; font-size: 12px;">✅ Quality Assured</span>
                <span style="display: inline-block; background-color: #e3f2fd; color: #1565c0; padding: 5px 12px; border-radius: 20px; margin: 5px; font-size: 12px;">✅ Financing Available</span>
                <span style="display: inline-block; background-color: #fff3e0; color: #e65100; padding: 5px 12px; border-radius: 20px; margin: 5px; font-size: 12px;">✅ Trade-ins Welcome</span>
              </div>
            </td>
          </tr>

          <!-- Contact Section -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                📞 Contact Us Today:
              </p>
              <p style="margin: 5px 0; color: #1a1a2e; font-weight: bold;">
                Justice Vincent: 0722827458
              </p>
              <p style="margin: 5px 0; color: #1a1a2e; font-weight: bold;">
                Daniel Maina: 0701460110
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 20px; text-align: center;">
              <p style="color: #f5c518; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
                🌐 www.justiceultimateautomobiles.com
              </p>
              <p style="color: #888; margin: 0; font-size: 12px;">
                © 2025 Justice Ultimate Automobiles. All rights reserved.
              </p>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 11px;">
                You're receiving this because you're a valued customer.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const { error: emailError } = await resend.emails.send({
            from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
            to: [recipient.email],
            subject: `🚗 ${actionText}: ${carTitle} - KSh ${formattedPrice}`,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`Email failed for ${recipient.email}:`, emailError);
            emailFailCount++;
          } else {
            emailSuccessCount++;
            console.log(`Email sent to ${recipient.email}`);
          }

          // Respect Resend rate limit: max 2 requests per second = 500ms delay minimum
          await new Promise(resolve => setTimeout(resolve, 550));
        } catch (err) {
          emailFailCount++;
          console.error(`Error sending email to ${recipient.email}:`, err);
        }
      }
    } else {
      console.log("RESEND_API_KEY not configured - skipping email notifications");
    }

    // ============ CREATE IN-APP NOTIFICATIONS ============
    const notificationsToInsert = allRecipients
      .filter(c => c.user_id)
      .map(recipient => ({
        user_id: recipient.user_id,
        title: `${carData.isUpdate ? '🔄 Car Updated' : '🚗 New Arrival'}`,
        message: `${carTitle} - KSh ${formattedPrice}. ${carData.isUpdate ? 'Check out the updated details!' : 'Now available in our showroom!'}`,
        type: 'car_notification',
        is_read: false,
        metadata: {
          car_id: carData.carId,
          stock_id: carData.stockId,
          make: carData.make,
          model: carData.model,
          year: carData.year,
          price: carData.price,
          image_url: carData.imageUrl,
          is_update: carData.isUpdate || false,
        }
      }));

    if (notificationsToInsert.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);

      if (notifError) {
        console.error("Error creating in-app notifications:", notifError);
      } else {
        notificationCount = notificationsToInsert.length;
        console.log(`Created ${notificationCount} in-app notifications`);
      }
    }

    // ============ SEND WHATSAPP NOTIFICATIONS ============
    const apiKey = Deno.env.get("APIWAP_API_KEY");
    if (apiKey) {
      const whatsappMessage = `🚗 *${actionText} at Justice Ultimate Automobiles!*

🔥 *${carTitle}*

💰 Price: *KSh ${formattedPrice}*
🏷️ Stock ID: ${carData.stockId}
${carData.color ? `🎨 Color: ${carData.color}` : ''}
${carData.fuelType ? `⛽ Fuel: ${carData.fuelType}` : ''}
${carData.transmission ? `⚙️ Transmission: ${carData.transmission}` : ''}

✅ Quality Assured
✅ Financing Available
✅ Trade-ins Welcome

👉 View Details: ${carLink}

📞 Contact Us:
Justice Vincent: 0722827458
Daniel Maina: 0701460110

🌐 www.justiceultimateautomobiles.com`;

      const formatPhoneNumber = (phone: string, countryCode: string): string => {
        let cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        const codeDigits = countryCode.replace(/\D/g, '');
        if (cleaned.startsWith(codeDigits)) cleaned = cleaned.substring(codeDigits.length);
        if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
        return countryCode + cleaned;
      };

      const validatePhone = (phone: string): boolean => {
        let cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        if (cleaned.startsWith('254')) cleaned = cleaned.substring(3);
        return cleaned.length >= 7 && cleaned.length <= 12;
      };

      for (const recipient of allRecipients) {
        if (!recipient.phone || !validatePhone(recipient.phone)) continue;

        const recipientCountryCode = recipient.country_code || '+254';
        const formattedPhone = formatPhoneNumber(recipient.phone, recipientCountryCode);

        try {
          const response = await fetch("https://api.apiwap.com/api/v1/whatsapp/send-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              phoneNumber: formattedPhone,
              message: whatsappMessage,
              type: "text",
            }),
          });

          if (response.ok) {
            whatsappSuccessCount++;
          } else {
            whatsappFailCount++;
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          whatsappFailCount++;
        }
      }
    } else {
      console.log("APIWAP_API_KEY not configured - skipping WhatsApp notifications");
    }

    // Log the notification
    await supabase.from("audit_logs").insert({
      action: carData.isUpdate ? "car_update_notification" : "new_car_notification",
      metadata: {
        car_id: carData.carId,
        stock_id: carData.stockId,
        make: carData.make,
        model: carData.model,
        email_success: emailSuccessCount,
        email_fail: emailFailCount,
        whatsapp_success: whatsappSuccessCount,
        whatsapp_fail: whatsappFailCount,
        in_app_notifications: notificationCount,
      },
    });

    console.log(`Notifications complete: Emails(${emailSuccessCount}/${emailFailCount}), WhatsApp(${whatsappSuccessCount}/${whatsappFailCount}), In-App(${notificationCount})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent`,
        emailSuccessCount,
        emailFailCount,
        whatsappSuccessCount,
        whatsappFailCount,
        notificationCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-new-car-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
