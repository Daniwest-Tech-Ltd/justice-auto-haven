import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "rental" | "trade_in" | "trade_in_approved" | "trade_in_rejected" | "crm_lead" | "payroll";
  to: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: NotificationRequest = await req.json();

    let subject = "";
    let html = "";

    switch (type) {
      case "rental":
        subject = "Rental Booking Confirmation - Justice Ultimate Automobiles";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">Rental Booking Received</h1>
            <p>Dear ${data.customerName},</p>
            <p>Thank you for your rental booking request. We have received your request and will confirm it shortly.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Booking Details</h2>
              <p><strong>Vehicle:</strong> ${data.carName || `${data.carMake} ${data.carModel}`}</p>
              <p><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleString()}</p>
              <p><strong>End Date:</strong> ${new Date(data.endDate).toLocaleString()}</p>
              <p><strong>Estimated Total:</strong> KES ${parseFloat(data.totalPrice).toLocaleString()}</p>
            </div>
            
            <p>Our team will review your request and contact you within 24 hours to confirm availability and finalize details.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Justice Ultimate Automobiles Team</p>
          </div>
        `;
        break;

      case "trade_in":
        subject = "Trade-In Request Confirmation - Justice Ultimate Automobiles";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">Trade-In Request Received</h1>
            <p>Dear ${data.customerName},</p>
            <p>Thank you for submitting your trade-in request. We have received your information and will evaluate it shortly.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Your Vehicle Details</h2>
              <p><strong>Vehicle:</strong> ${data.carMake} ${data.carModel} (${data.carYear})</p>
              <p><strong>Mileage:</strong> ${data.carMileage || 'Not specified'}</p>
              <p><strong>Condition:</strong> ${data.carCondition || 'Not specified'}</p>
            </div>
            
            <p>Our team will review your vehicle information and photos, and contact you within 48 hours with an evaluation.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>Justice Ultimate Automobiles Team</p>
          </div>
        `;
        break;
      
      case "trade_in_approved":
        subject = "Trade-In Request Approved - Justice Ultimate Automobiles";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Trade-In Request Approved!</h1>
            <p>Dear ${data.customerName},</p>
            <p>Great news! Your trade-in request has been approved.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h2 style="margin-top: 0;">Vehicle Details</h2>
              <p><strong>Vehicle:</strong> ${data.carMake} ${data.carModel} (${data.carYear})</p>
              ${data.estimatedValue ? `<p><strong>Estimated Value:</strong> KES ${parseFloat(data.estimatedValue).toLocaleString()}</p>` : ''}
              ${data.adminNotes ? `<p><strong>Notes:</strong> ${data.adminNotes}</p>` : ''}
            </div>
            
            <p>Please contact us to schedule an inspection and finalize the trade-in process.</p>
            <p><strong>Contact:</strong> +254 722 827 458</p>
            
            <p>Best regards,<br>Justice Ultimate Automobiles Team</p>
          </div>
        `;
        break;
      
      case "trade_in_rejected":
        subject = "Trade-In Request Update - Justice Ultimate Automobiles";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Trade-In Request Update</h1>
            <p>Dear ${data.customerName},</p>
            <p>Thank you for your interest in trading in your vehicle with us.</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h2 style="margin-top: 0;">Vehicle Details</h2>
              <p><strong>Vehicle:</strong> ${data.carMake} ${data.carModel} (${data.carYear})</p>
              ${data.adminNotes ? `<p><strong>Notes:</strong> ${data.adminNotes}</p>` : ''}
            </div>
            
            <p>Unfortunately, we are unable to proceed with your trade-in request at this time. However, we appreciate your interest and encourage you to explore other options with us.</p>
            <p>If you have any questions, please don't hesitate to contact us at +254 722 827 458.</p>
            
            <p>Best regards,<br>Justice Ultimate Automobiles Team</p>
          </div>
        `;
        break;

      case "crm_lead":
        subject = "New CRM Lead Created";
        html = `
          <h1>New Lead</h1>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Source:</strong> ${data.source}</p>
          <p><strong>Interest:</strong> ${data.interest}</p>
          <p>Please follow up with this lead.</p>
        `;
        break;

      case "payroll":
        subject = "Payroll Generated";
        html = `
          <h1>Payroll Notification</h1>
          <p><strong>Employee:</strong> ${data.employeeName}</p>
          <p><strong>Pay Period:</strong> ${data.payPeriod}</p>
          <p><strong>Net Pay:</strong> KES ${parseFloat(data.netPay).toLocaleString()}</p>
          <p>Your payslip is ready for download in the HR portal.</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
