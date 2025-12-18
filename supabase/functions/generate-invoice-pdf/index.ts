import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  invoice_id?: string;
  order_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  notes?: string;
  due_date?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const data: InvoiceRequest = await req.json();
    console.log("Generating invoice for:", data.customer_name);

    // Generate invoice number
    const { data: invoiceNoResult, error: seqError } = await supabase.rpc('generate_invoice_number');
    if (seqError) {
      console.error("Error generating invoice number:", seqError);
      throw new Error("Failed to generate invoice number");
    }
    const invoiceNo = invoiceNoResult;

    // Format date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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

    // Generate items rows
    const itemsRows = data.items.map((item, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      background: #ffffff;
      color: #1f2937;
      position: relative;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      font-weight: 700;
      color: rgba(220, 38, 38, 0.05);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #dc2626;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 24px;
    }
    .company-name {
      font-size: 20px;
      font-weight: 700;
      color: #dc2626;
    }
    .company-tagline {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 36px;
      font-weight: 700;
      color: #dc2626;
      margin: 0;
    }
    .invoice-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .meta-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
    }
    .meta-box h3 {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin: 0 0 10px 0;
    }
    .meta-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .meta-box strong {
      color: #111827;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #dc2626;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }
    .items-table th:first-child {
      border-radius: 8px 0 0 0;
    }
    .items-table th:last-child {
      border-radius: 0 8px 0 0;
      text-align: right;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-box {
      width: 300px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.grand {
      border-top: 2px solid #dc2626;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .footer-contacts {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 10px;
    }
    .notes {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .notes strong {
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="watermark">JUSTICE ULTIMATE AUTOMOBILES</div>
  
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">JUA</div>
        <div>
          <div class="company-name">Justice Ultimate Automobiles</div>
          <div class="company-tagline">Trusted. Reliable. With you every step of the way.</div>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">${invoiceNo}</p>
      </div>
    </div>

    <div class="invoice-meta">
      <div class="meta-box">
        <h3>Bill To</h3>
        <p><strong>${data.customer_name}</strong></p>
        ${data.customer_email ? `<p>${data.customer_email}</p>` : ''}
        ${data.customer_phone ? `<p>${data.customer_phone}</p>` : ''}
        ${data.customer_address ? `<p>${data.customer_address}</p>` : ''}
      </div>
      <div class="meta-box">
        <h3>Invoice Details</h3>
        <p><strong>Invoice No:</strong> ${invoiceNo}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        ${data.order_id ? `<p><strong>Order Ref:</strong> ${data.order_id.substring(0, 8).toUpperCase()}</p>` : ''}
        ${data.due_date ? `<p><strong>Due Date:</strong> ${data.due_date}</p>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Description</th>
          <th style="width: 80px; text-align: center;">Qty</th>
          <th style="width: 120px; text-align: right;">Unit Price</th>
          <th style="width: 120px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>VAT (${data.vat_rate}%)</span>
          <span>${formatCurrency(data.vat_amount)}</span>
        </div>
        <div class="total-row grand">
          <span>Grand Total</span>
          <span>${formatCurrency(data.grand_total)}</span>
        </div>
      </div>
    </div>

    ${data.notes ? `
    <div class="notes">
      <strong>Notes:</strong> ${data.notes}
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>This is a computer-generated invoice. Payment is due upon receipt unless otherwise stated.</p>
      <div class="footer-contacts">
        <span>📞 0722 827 458</span>
        <span>📧 info@justiceultimateautomobiles.com</span>
        <span>🌐 www.justiceultimateautomobiles.com</span>
      </div>
      <p style="margin-top: 15px; font-size: 10px;">Developed by Daniwest Tech Sol</p>
    </div>
  </div>
</body>
</html>
    `;

    // Store invoice in database
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_no: invoiceNo,
        order_id: data.order_id || null,
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address,
        items: data.items,
        subtotal: data.subtotal,
        vat_rate: data.vat_rate,
        vat_amount: data.vat_amount,
        grand_total: data.grand_total,
        notes: data.notes,
        due_date: data.due_date,
        status: 'issued'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing invoice:", insertError);
      throw new Error("Failed to store invoice");
    }

    console.log("Invoice generated successfully:", invoiceNo);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_no: invoiceNo,
        invoice_id: invoice.id,
        html: invoiceHtml
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
