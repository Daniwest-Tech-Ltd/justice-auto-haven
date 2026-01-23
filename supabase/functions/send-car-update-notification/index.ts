import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CarUpdateRequest {
  carId: string;
  carDetails: {
    make: string;
    model: string;
    year: number;
    price: number;
    stockId?: string;
    imageUrl?: string;
  };
  action: 'added' | 'updated';
}

// Admin emails that should always receive notifications
const ADMIN_EMAILS = [
  'daniwesttechnologies@gmail.com',
  'justicevincentt@gmail.com'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { carId, carDetails, action }: CarUpdateRequest = await req.json();

    if (!carId || !carDetails) {
      throw new Error("Car ID and details are required");
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all active customers
    const { data: customers, error: customersError } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .eq("is_suspended", false)
      .not("email", "is", null);

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      throw customersError;
    }

    // Get customer role user IDs
    const { data: customerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    const customerUserIds = new Set(customerRoles?.map(r => r.user_id) || []);
    
    // Filter to only customers
    const customersToNotify = customers?.filter(c => customerUserIds.has(c.user_id)) || [];
    
    // Always include admin emails
    const allEmails = [
      ...ADMIN_EMAILS,
      ...customersToNotify.map(c => c.email).filter(Boolean)
    ];

    // Remove duplicates
    const uniqueEmails = [...new Set(allEmails)];

    const actionText = action === 'added' ? 'New Car Added' : 'Car Updated';
    const actionEmoji = action === 'added' ? '🚗' : '✨';
    
    const carLink = `https://www.justiceultimateautomobiles.com/car/${carDetails.stockId || carId}`;

    let successCount = 0;
    let failCount = 0;

    // Send emails in batches to avoid rate limiting
    for (let i = 0; i < uniqueEmails.length; i++) {
      const email = uniqueEmails[i];
      const customer = customersToNotify.find(c => c.email === email);
      const recipientName = customer?.full_name || 'Valued Customer';

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
            to: [email],
            subject: `${actionEmoji} ${actionText}: ${carDetails.year} ${carDetails.make} ${carDetails.model}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
                <div style="max-width: 600px; margin: 0 auto; background: white;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${actionEmoji} ${actionText}!</h1>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 30px;">
                    <p style="color: #4b5563; margin: 0 0 20px;">Hello ${recipientName},</p>
                    
                    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px;">
                      ${action === 'added' 
                        ? 'A brand new vehicle has just been added to our inventory!' 
                        : 'One of our vehicles has been updated with new details!'}
                    </p>
                    
                    <!-- Car Card -->
                    <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 20px 0;">
                      ${carDetails.imageUrl ? `
                        <img src="${carDetails.imageUrl}" alt="${carDetails.make} ${carDetails.model}" 
                             style="width: 100%; height: 200px; object-fit: cover;">
                      ` : `
                        <div style="width: 100%; height: 150px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 48px;">🚗</span>
                        </div>
                      `}
                      <div style="padding: 20px;">
                        <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 22px;">
                          ${carDetails.year} ${carDetails.make} ${carDetails.model}
                        </h2>
                        <p style="color: #6b7280; margin: 0 0 5px; font-size: 14px;">
                          Stock ID: ${carDetails.stockId || 'N/A'}
                        </p>
                        <p style="color: #f59e0b; font-size: 24px; font-weight: 700; margin: 15px 0 0;">
                          KSh ${carDetails.price?.toLocaleString() || 'Contact for Price'}
                        </p>
                      </div>
                    </div>
                    
                    <!-- CTA -->
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="${carLink}" 
                         style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        View Vehicle Details →
                      </a>
                    </div>
                    
                    <!-- Sale Banner -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
                      <p style="color: #92400e; margin: 0; font-weight: 600;">
                        🎉 NEW YEAR MEGA SALE 2026 - Up to 90% Asset Financing!
                      </p>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background: #1f2937; padding: 20px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      Justice Ultimate Automobiles | Westlands, Nairobi | 0722827458
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to send to ${email}:`, await emailResponse.text());
        }

        // Rate limiting - wait 100ms between emails
        if (i < uniqueEmails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (emailError) {
        failCount++;
        console.error(`Error sending to ${email}:`, emailError);
      }
    }

    // Also create in-app notifications for all customers
    const notifications = customersToNotify.map(customer => ({
      user_id: customer.user_id,
      title: `${actionText}: ${carDetails.year} ${carDetails.make} ${carDetails.model}`,
      message: `Check out ${action === 'added' ? 'this new' : 'the updated'} ${carDetails.make} ${carDetails.model} - KSh ${carDetails.price?.toLocaleString()}`,
      type: 'car_update',
      is_read: false,
      metadata: { carId, action, stockId: carDetails.stockId }
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // Log to audit trail
    await supabase.from("audit_logs").insert({
      action: "car_update_notification_sent",
      metadata: { 
        carId, 
        action,
        emailsSent: successCount,
        emailsFailed: failCount,
        totalRecipients: uniqueEmails.length
      }
    });

    console.log(`Car update notifications: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount} recipients`,
        sent: successCount,
        failed: failCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending car update notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
