import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "rental" | "trade_in" | "crm_lead" | "payroll";
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
        subject = "New Car Rental Booking Received";
        html = `
          <h1>New Rental Booking</h1>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Car:</strong> ${data.carMake} ${data.carModel}</p>
          <p><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
          <p><strong>Total Price:</strong> KES ${parseFloat(data.totalPrice).toLocaleString()}</p>
          <p>Please review this booking in the admin dashboard.</p>
        `;
        break;

      case "trade_in":
        subject = "New Trade-In Submission";
        html = `
          <h1>New Trade-In Request</h1>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Vehicle:</strong> ${data.carMake} ${data.carModel} (${data.carYear})</p>
          <p><strong>Mileage:</strong> ${data.carMileage}</p>
          <p><strong>Condition:</strong> ${data.carCondition}</p>
          <p>Please review this trade-in request in the admin dashboard.</p>
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
      from: "Justice Ultimate Automobiles <onboarding@resend.dev>",
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
