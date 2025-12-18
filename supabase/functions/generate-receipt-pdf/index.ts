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
      }).format(amount).replace('KES', 'KES ');
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

    // Generate HTML receipt
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receiptNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      background: #ffffff;
      color: #1f2937;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 60px;
      font-weight: 700;
      color: rgba(34, 197, 94, 0.05);
      white-space: nowrap;
      pointer-events: none;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border: 2px solid #22c55e;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header .company {
      font-size: 14px;
      margin-top: 5px;
      opacity: 0.9;
    }
    .paid-badge {
      background: white;
      color: #22c55e;
      padding: 8px 20px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 15px;
      font-weight: 700;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .receipt-info {
      background: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .receipt-info p {
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
    }
    .receipt-info strong {
      color: #166534;
    }
    .amount-box {
      background: #22c55e;
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
    }
    .amount-box .label {
      font-size: 14px;
      opacity: 0.9;
    }
    .amount-box .amount {
      font-size: 32px;
      font-weight: 700;
      margin-top: 5px;
    }
    .details {
      border-top: 1px dashed #e5e7eb;
      padding-top: 20px;
    }
    .details p {
      margin: 10px 0;
      font-size: 14px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .footer strong {
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="watermark">PAID</div>
  
  <div class="container">
    <div class="header">
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
      <p>📞 0722 827 458 | 📧 info@justiceultimateautomobiles.com</p>
      <p>www.justiceultimateautomobiles.com</p>
      <p style="margin-top: 10px; font-size: 10px;">Developed by Daniwest Tech Sol</p>
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
