import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  phone: string;
  customerName: string;
  carMake: string;
  carModel: string;
  carYear: number;
  status: string;
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, customerName, carMake, carModel, carYear, status, adminNotes }: NotificationRequest = await req.json();

    let subject = "";
    let htmlContent = "";

    // Generate email based on status
    switch (status) {
      case "approved":
        subject = "✅ Your VIP Order Has Been Approved!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">✅ Order Approved!</h1>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${customerName},</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Great news! Your VIP order for the <strong>${carMake} ${carModel} (${carYear})</strong> has been approved! 🎉
              </p>
              
              <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #166534; font-weight: 600;">Next Steps:</p>
                <p style="margin: 10px 0 0 0; color: #166534;">We will be reaching out to you shortly via your preferred contact method to finalize the details.</p>
              </div>
              
              ${adminNotes ? `
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #374151; font-weight: 600;">Note from our team:</p>
                  <p style="margin: 10px 0 0 0; color: #6b7280;">${adminNotes}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">Need Help?</p>
              <p style="color: #f3f4f6; margin: 0; font-size: 14px;">
                📞 Call: 0722827458<br>
                📧 Email: justicevincentt@gmail.com
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Justice Ultimate Automobiles<br>
                Kenya's Premier Car Dealership
              </p>
            </div>
          </div>
        `;
        break;

      case "contacted":
        subject = "📞 We've Reached Out to You!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">📞 We're In Touch!</h1>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${customerName},</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                We have reached out to you regarding your VIP order for the <strong>${carMake} ${carModel} (${carYear})</strong>.
              </p>
              
              <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af;">Please check your phone: <strong>${phone}</strong></p>
              </div>
              
              ${adminNotes ? `
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #374151; font-weight: 600;">Message from our team:</p>
                  <p style="margin: 10px 0 0 0; color: #6b7280;">${adminNotes}</p>
                </div>
              ` : ''}
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you missed our call or message, please contact us at 0722827458.
              </p>
            </div>
            
            <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">Contact Us Anytime</p>
              <p style="color: #f3f4f6; margin: 0; font-size: 14px;">
                📞 Call: 0722827458<br>
                📧 Email: justicevincentt@gmail.com
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Justice Ultimate Automobiles<br>
                Kenya's Premier Car Dealership
              </p>
            </div>
          </div>
        `;
        break;

      case "closed":
        subject = "Thank You for Choosing Justice Ultimate Automobiles!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #f9fafb, #ffffff); border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6b7280; margin: 0;">🎊 Order Complete!</h1>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${customerName},</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Your VIP order for the <strong>${carMake} ${carModel} (${carYear})</strong> has been completed successfully! 🎉
              </p>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;">
                  Thank you for choosing Justice Ultimate Automobiles. We hope to serve you again in the future!
                </p>
              </div>
              
              ${adminNotes ? `
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-weight: 600;">Final Note:</p>
                  <p style="margin: 10px 0 0 0; color: #78350f;">${adminNotes}</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">Stay Connected</p>
              <p style="color: #f3f4f6; margin: 0; font-size: 14px;">
                📞 Call: 0722827458<br>
                📧 Email: justicevincentt@gmail.com
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Justice Ultimate Automobiles<br>
                Kenya's Premier Car Dealership
              </p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error("Invalid status");
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Justice Ultimate Automobiles <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const data = await emailResponse.json();

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
