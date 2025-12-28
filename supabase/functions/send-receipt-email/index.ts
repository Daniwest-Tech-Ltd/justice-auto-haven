import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptEmailRequest {
  customer_email: string;
  customer_name: string;
  receipt_number: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_date: string;
  description: string;
  pdf_base64?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customer_email,
      customer_name,
      receipt_number,
      amount,
      currency,
      payment_method,
      transaction_date,
      description,
      pdf_base64
    }: ReceiptEmailRequest = await req.json();

    console.log(`Sending receipt email to ${customer_email}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .success-badge { background: #22c55e; color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
          .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .details-row:last-child { border-bottom: none; }
          .details-label { color: #6b7280; }
          .details-value { font-weight: 600; color: #111827; }
          .amount-box { background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .amount-box .label { font-size: 14px; opacity: 0.9; }
          .amount-box .value { font-size: 32px; font-weight: bold; margin-top: 5px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .footer a { color: #dc2626; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>JUSTICE ULTIMATE AUTOMOBILES</h1>
            <p>Premier Car Dealership in Kenya</p>
          </div>
          
          <div class="content">
            <div style="text-align: center;">
              <div class="success-badge">✓ Payment Successful</div>
            </div>
            
            <p>Dear ${customer_name},</p>
            <p>Thank you for your payment. Your transaction has been completed successfully.</p>
            
            <div class="details">
              <div class="details-row">
                <span class="details-label">Receipt Number:</span>
                <span class="details-value">${receipt_number}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Transaction Date:</span>
                <span class="details-value">${transaction_date}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Description:</span>
                <span class="details-value">${description}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Payment Method:</span>
                <span class="details-value">${payment_method}</span>
              </div>
            </div>
            
            <div class="amount-box">
              <div class="label">Amount Paid</div>
              <div class="value">${currency} ${amount.toLocaleString()}</div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              ${pdf_base64 ? 'Your receipt is attached to this email.' : 'Please keep this email for your records.'}
            </p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br><strong>Justice Ultimate Automobiles Team</strong></p>
          </div>
          
          <div class="footer">
            <p>Justice Ultimate Automobiles</p>
            <p>Phone: 0722 827 458 | 0701 460 110</p>
            <p>Email: <a href="mailto:info@justiceultimateautomobiles.com">info@justiceultimateautomobiles.com</a></p>
            <p style="margin-top: 10px;">This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      attachments?: { filename: string; content: string }[];
    } = {
      from: "Justice Ultimate Automobiles <receipts@justiceultimateautomobiles.com>",
      to: [customer_email],
      subject: `Payment Receipt - ${receipt_number} | Justice Ultimate Automobiles`,
      html: emailHtml,
    };

    // Add PDF attachment if provided
    if (pdf_base64) {
      emailPayload.attachments = [
        {
          filename: `JUA-Receipt-${receipt_number}.pdf`,
          content: pdf_base64,
        },
      ];
    }

    // Send via Resend API directly
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailResponse = await resendResponse.json();
    console.log("Receipt email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending receipt email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
