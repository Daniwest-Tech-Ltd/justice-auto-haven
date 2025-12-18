import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptRequest {
  invoice_id?: string;
  payment_id?: string;
  customer_id: string;
  customer_name: string;
  amount_paid: number;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
}

// Kenya Coat of Arms URL
const kenyaCoatOfArmsUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Coat_of_arms_of_Kenya_%28Official%29.svg/200px-Coat_of_arms_of_Kenya_%28Official%29.svg.png";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: ReceiptRequest = await req.json();
    console.log("Generating receipt for:", data.customer_name);

    // Generate receipt number
    const { data: receiptNoResult, error: seqError } = await supabase.rpc('generate_receipt_number');
    if (seqError) {
      console.error("Error generating receipt number:", seqError);
      throw new Error("Failed to generate receipt number");
    }
    const receiptNo = receiptNoResult;

    // Format date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = today.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount).replace('KES', 'Ksh ');
    };

    // Get invoice details if provided
    let invoiceNo = 'N/A';
    if (data.invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('invoice_no')
        .eq('id', data.invoice_id)
        .single();
      if (invoice) invoiceNo = invoice.invoice_no;
    }

    // Generate HTML receipt with blue theme
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receiptNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 30px;
      background: #ffffff;
      color: #1f2937;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 50px;
      font-weight: 700;
      color: rgba(30, 64, 175, 0.06);
      white-space: nowrap;
      pointer-events: none;
      text-align: center;
      line-height: 1.2;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border: 3px solid #1e40af;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }
    .header {
      background: linear-gradient(135deg, #1e40af, #1e3a8a);
      color: white;
      padding: 25px;
      text-align: center;
      position: relative;
    }
    .header-logos {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .logo {
      width: 50px;
      height: 50px;
      background: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e40af;
      font-weight: 700;
      font-size: 16px;
    }
    .kenya-logo {
      width: 50px;
      height: auto;
      background: white;
      border-radius: 8px;
      padding: 4px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 1px;
    }
    .header .company {
      font-size: 13px;
      margin-top: 5px;
      opacity: 0.9;
    }
    .paid-badge {
      background: white;
      color: #1e40af;
      padding: 8px 20px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 15px;
      font-weight: 700;
      font-size: 13px;
    }
    .content {
      padding: 25px;
    }
    .receipt-info {
      background: #f0f4ff;
      padding: 18px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #1e40af;
    }
    .receipt-info p {
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #374151;
    }
    .receipt-info strong {
      color: #1e40af;
      font-weight: 600;
    }
    .amount-box {
      background: linear-gradient(135deg, #1e40af, #1e3a8a);
      color: white;
      padding: 22px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
    }
    .amount-box .label {
      font-size: 13px;
      opacity: 0.9;
    }
    .amount-box .amount {
      font-size: 28px;
      font-weight: 700;
      margin-top: 5px;
    }
    .details {
      border-top: 2px dashed #e5e7eb;
      padding-top: 18px;
    }
    .details p {
      margin: 10px 0;
      font-size: 13px;
      color: #374151;
    }
    .details strong {
      color: #1f2937;
    }
    .footer {
      background: #f8fafc;
      padding: 18px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer strong {
      color: #1e40af;
      font-size: 13px;
    }
    .footer-contacts {
      margin-top: 8px;
    }
    .dev-credit {
      margin-top: 12px;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="watermark">JUSTICE ULTIMATE<br/>AUTOMOBILES</div>
  
  <div class="container">
    <div class="header">
      <div class="header-logos">
        <div class="logo">JUA</div>
        <img src="${kenyaCoatOfArmsUrl}" alt="Kenya" class="kenya-logo" />
      </div>
      <h1>🧾 PAYMENT RECEIPT</h1>
      <div class="company">Justice Ultimate Automobiles</div>
      <div class="paid-badge">✓ PAYMENT CONFIRMED</div>
    </div>

    <div class="content">
      <div class="receipt-info">
        <p><span>Receipt No:</span> <strong>${receiptNo}</strong></p>
        <p><span>Date:</span> <strong>${formattedDate}</strong></p>
        <p><span>Time:</span> <strong>${formattedTime}</strong></p>
        ${invoiceNo !== 'N/A' ? `<p><span>Invoice Ref:</span> <strong>${invoiceNo}</strong></p>` : ''}
      </div>

      <div class="amount-box">
        <div class="label">Amount Received</div>
        <div class="amount">${formatCurrency(data.amount_paid)}</div>
      </div>

      <div class="details">
        <p><strong>Received From:</strong> ${data.customer_name}</p>
        <p><strong>Payment Method:</strong> ${data.payment_method.toUpperCase()}</p>
        ${data.payment_reference ? `<p><strong>Reference:</strong> ${data.payment_reference}</p>` : ''}
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for your payment!</strong></p>
      <div class="footer-contacts">
        <p>📞 0722 827 458 | 📧 info@justiceultimateautomobiles.com</p>
        <p>🌐 www.justiceultimateautomobiles.com</p>
      </div>
      <p class="dev-credit">Developed by Daniwest Tech Sol</p>
    </div>
  </div>
</body>
</html>
    `;

    // Store receipt in database
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        receipt_no: receiptNo,
        invoice_id: data.invoice_id || null,
        payment_id: data.payment_id || null,
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        amount_paid: data.amount_paid,
        payment_method: data.payment_method,
        payment_reference: data.payment_reference,
        notes: data.notes
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing receipt:", insertError);
      throw new Error("Failed to store receipt");
    }

    console.log("Receipt generated successfully:", receiptNo);

    return new Response(
      JSON.stringify({
        success: true,
        receipt_no: receiptNo,
        receipt_id: receipt.id,
        html: receiptHtml
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
