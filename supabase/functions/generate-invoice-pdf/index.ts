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

// Justice Ultimate Automobiles Logo as base64 SVG
const juaLogoSvg = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiMxZTQwYWYiLz4KPHRleHQgeD0iNTAlIiB5PSI1NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5KVUE8L3RleHQ+Cjwvc3ZnPg==`;

// Kenya Coat of Arms - using a placeholder since we can't embed the actual image
const kenyaCoatOfArmsUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Coat_of_arms_of_Kenya_%28Official%29.svg/200px-Coat_of_arms_of_Kenya_%28Official%29.svg.png";

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
      }).format(amount).replace('KES', 'Ksh ');
    };

    // Generate items rows
    const itemsRows = data.items.map((item, index) => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px;">${index + 1}</td>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; font-weight: 500;">${item.description}</td>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #1f2937; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-size: 14px;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    // Generate HTML invoice with blue theme
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNo}</title>
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
      position: relative;
      min-height: 100vh;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 60px;
      font-weight: 700;
      color: rgba(30, 64, 175, 0.06);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      text-align: center;
      line-height: 1.2;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 4px solid #1e40af;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #1e40af, #1e3a8a);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 22px;
    }
    .company-info {
      display: flex;
      flex-direction: column;
    }
    .company-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 2px;
    }
    .company-tagline {
      font-size: 11px;
      color: #6b7280;
    }
    .header-right {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1e40af;
      margin: 0;
      letter-spacing: 2px;
    }
    .invoice-title .invoice-number {
      color: #4b5563;
      font-size: 13px;
      margin-top: 5px;
      font-weight: 500;
    }
    .kenya-logo {
      width: 65px;
      height: auto;
    }
    .invoice-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 25px;
    }
    .meta-box {
      background: #f0f4ff;
      padding: 18px;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }
    .meta-box h3 {
      font-size: 11px;
      font-weight: 700;
      color: #1e40af;
      text-transform: uppercase;
      margin: 0 0 12px 0;
      letter-spacing: 1px;
    }
    .meta-box p {
      margin: 6px 0;
      font-size: 13px;
      color: #374151;
    }
    .meta-box strong {
      color: #111827;
      font-weight: 600;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      border-radius: 8px;
      overflow: hidden;
    }
    .items-table th {
      background: #1e40af;
      color: white;
      padding: 14px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table th:last-child {
      text-align: right;
    }
    .items-table th:nth-child(3),
    .items-table th:nth-child(4) {
      text-align: center;
    }
    .items-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 280px;
      background: #f0f4ff;
      padding: 18px;
      border-radius: 8px;
      border: 2px solid #1e40af;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #374151;
    }
    .total-row.grand {
      border-top: 2px solid #1e40af;
      margin-top: 10px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
    }
    .footer {
      text-align: center;
      padding-top: 25px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .footer-title {
      color: #1e40af;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .footer-contacts {
      display: flex;
      justify-content: center;
      gap: 25px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .footer-contacts span {
      color: #4b5563;
    }
    .notes {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
      font-size: 13px;
      border-left: 4px solid #f59e0b;
    }
    .notes strong {
      color: #92400e;
    }
    .dev-credit {
      margin-top: 15px;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="watermark">JUSTICE ULTIMATE<br/>AUTOMOBILES</div>
  
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">JUA</div>
        <div class="company-info">
          <div class="company-name">Justice Ultimate Automobiles</div>
          <div class="company-tagline">Trusted. Reliable. With you every step of the way.</div>
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <p class="invoice-number">${invoiceNo}</p>
        </div>
        <img src="${kenyaCoatOfArmsUrl}" alt="Kenya Coat of Arms" class="kenya-logo" />
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
          <th style="width: 130px; text-align: right;">Unit Price</th>
          <th style="width: 130px; text-align: right;">Amount</th>
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
      <p class="footer-title">Thank you for your business!</p>
      <p>This is a computer-generated invoice. Payment is due upon receipt unless otherwise stated.</p>
      <div class="footer-contacts">
        <span>📞 0722 827 458</span>
        <span>📧 info@justiceultimateautomobiles.com</span>
        <span>🌐 www.justiceultimateautomobiles.com</span>
      </div>
      <p class="dev-credit">Developed by Daniwest Tech Sol</p>
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
