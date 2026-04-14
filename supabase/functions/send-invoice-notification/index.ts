import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  invoice_id: string;
  send_email?: boolean;
  send_whatsapp?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const whatsappApiKey = Deno.env.get("APIWAP_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const data: NotificationRequest = await req.json();

    console.log("Sending invoice notification for:", data.invoice_id);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', data.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Invoice not found");
    }

    const results: any = { email: null, whatsapp: null };

    // Format currency helper
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
      }).format(amount);
    };

    // Send email notification using fetch to Resend API
    if (data.send_email && invoice.customer_email && resendApiKey) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .total { font-size: 24px; font-weight: bold; color: #dc2626; }
    .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚗 Justice Ultimate Automobiles</h1>
      <p style="margin: 10px 0 0 0;">Your Invoice is Ready</p>
    </div>
    <div class="content">
      <p>Dear <strong>${invoice.customer_name}</strong>,</p>
      <p>Thank you for choosing Justice Ultimate Automobiles. Please find your invoice details below:</p>
      
      <div class="invoice-box">
        <p><strong>Invoice Number:</strong> ${invoice.invoice_no}</p>
        <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString('en-GB')}</p>
        <p><strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal)}</p>
        <p><strong>VAT (${invoice.vat_rate}%):</strong> ${formatCurrency(invoice.vat_amount)}</p>
        <p class="total"><strong>Grand Total:</strong> ${formatCurrency(invoice.grand_total)}</p>
      </div>

      <p>For any queries regarding this invoice, please don't hesitate to contact us.</p>
      
      <a href="https://www.justiceultimateautomobiles.com" class="btn">Visit Our Website</a>
      
      <div class="footer">
        <p><strong>Justice Ultimate Automobiles</strong></p>
        <p>📞 0722 827 458 | 📧 info@justiceultimateautomobiles.com</p>
        <p>Trusted. Reliable. With you every step of the way.</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
            to: [invoice.customer_email],
            subject: `Your Invoice ${invoice.invoice_no} - Justice Ultimate Automobiles`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        results.email = { success: emailResponse.ok, response: emailResult };

        if (emailResponse.ok) {
          await supabase
            .from('invoices')
            .update({ sent_email: true })
            .eq('id', invoice.id);

          console.log("Email sent successfully to:", invoice.customer_email);
        }
      } catch (emailError: any) {
        console.error("Email error:", emailError);
        results.email = { success: false, error: emailError.message };
      }
    }

    // Send WhatsApp notification
    if (data.send_whatsapp && invoice.customer_phone && whatsappApiKey) {
      try {
        // Format phone number
        let phone = invoice.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '254' + phone.substring(1);
        } else if (!phone.startsWith('254')) {
          phone = '254' + phone;
        }

        const message = `🚗 *JUSTICE ULTIMATE AUTOMOBILES*

📄 *Invoice ${invoice.invoice_no}*

Dear ${invoice.customer_name},

Your invoice is ready:

💰 *Amount Due: ${formatCurrency(invoice.grand_total)}*

For payment or queries:
📞 0722 827 458
🌐 www.justiceultimateautomobiles.com

Thank you for choosing us!
_Trusted. Reliable. With you every step of the way._`;

        const whatsappResponse = await fetch("https://api.apiwap.com/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${whatsappApiKey}`,
          },
          body: JSON.stringify({
            phone: phone,
            message: message,
          }),
        });

        results.whatsapp = { success: whatsappResponse.ok };

        if (whatsappResponse.ok) {
          await supabase
            .from('invoices')
            .update({ sent_whatsapp: true })
            .eq('id', invoice.id);

          console.log("WhatsApp sent successfully to:", phone);
        }
      } catch (whatsappError: any) {
        console.error("WhatsApp error:", whatsappError);
        results.whatsapp = { success: false, error: whatsappError.message };
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
