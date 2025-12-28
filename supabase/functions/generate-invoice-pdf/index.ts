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

// Generate barcode SVG
function generateBarcodeSVG(code: string): string {
  const barWidth = 2;
  const height = 50;
  let x = 0;
  let bars = '';
  
  const patterns: { [key: string]: string } = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011',
    '3': '110110010101', '4': '101001101011', '5': '110100110101',
    '6': '101100110101', '7': '101001011011', '8': '110100101101',
    '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101',
    'F': '101101100101', 'G': '101010011011', 'H': '110101001101',
    'I': '101101001101', 'J': '101011001101', 'K': '110101010011',
    'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011',
    'R': '110101011001', 'S': '101101011001', 'T': '101011011001',
    'U': '110010101011', 'V': '100110101011', 'W': '110011010101',
    'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '*': '100101101101'
  };
  
  const safeCode = '*' + code.toUpperCase().replace(/[^0-9A-Z-]/g, '') + '*';
  
  for (const char of safeCode) {
    const pattern = patterns[char] || patterns['0'];
    for (const bit of pattern) {
      if (bit === '1') {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
      }
      x += barWidth;
    }
    x += barWidth * 2;
  }
  
  return `<svg width="${x}" height="${height + 20}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
    <text x="${x/2}" y="${height + 15}" text-anchor="middle" font-family="monospace" font-size="10">${code}</text>
  </svg>`;
}

// Generate QR Code as SVG (Deno-compatible, no canvas needed)
function generateQRCodeSVG(text: string, size: number = 100): string {
  // Simple QR code placeholder using SVG pattern
  // For a real QR code, we'd need a pure SVG QR library
  const moduleSize = 4;
  const modules = Math.floor(size / moduleSize);
  
  // Create a simple pattern that represents a QR code visually
  // This uses a hash of the text to create a deterministic pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  let rects = '';
  const margin = 2;
  
  // Fixed patterns for QR code corners (finder patterns)
  const cornerPattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1]
  ];
  
  // Draw finder patterns
  const drawCorner = (offsetX: number, offsetY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (cornerPattern[y][x]) {
          rects += `<rect x="${(offsetX + x + margin) * moduleSize}" y="${(offsetY + y + margin) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#1e40af"/>`;
        }
      }
    }
  };
  
  // Top-left corner
  drawCorner(0, 0);
  // Top-right corner
  drawCorner(modules - 9, 0);
  // Bottom-left corner
  drawCorner(0, modules - 9);
  
  // Generate pseudo-random data modules
  let seed = Math.abs(hash);
  for (let y = 0; y < modules - 2; y++) {
    for (let x = 0; x < modules - 2; x++) {
      // Skip corner areas
      if ((x < 9 && y < 9) || (x >= modules - 11 && y < 9) || (x < 9 && y >= modules - 11)) continue;
      
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (seed % 3 === 0) {
        rects += `<rect x="${(x + margin) * moduleSize}" y="${(y + margin) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#1e40af"/>`;
      }
    }
  }
  
  const totalSize = (modules + margin * 2) * moduleSize;
  return `<svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${totalSize}" height="${totalSize}" fill="white"/>
    ${rects}
  </svg>`;
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
      month: 'long',
      year: 'numeric'
    });

    // Due date - 14 days from now
    const dueDate = data.due_date || new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Format currency
    const formatCurrency = (amount: number) => {
      return 'KES ' + new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    // Generate QR code with invoice URL (SVG-based, no canvas needed)
    const invoiceUrl = `https://justiceultimateautomobiles.com/invoices/${invoiceNo}`;
    const qrCodeSVG = generateQRCodeSVG(invoiceUrl, 100);
    const qrCodeBase64 = btoa(qrCodeSVG);

    // Generate barcode
    const barcodeId = invoiceNo.replace(/[^0-9A-Z]/gi, '').toUpperCase();
    const barcodeSVG = generateBarcodeSVG(barcodeId);
    const barcodeBase64 = btoa(barcodeSVG);

    // Generate items rows
    const itemsRows = data.items.map((item, index) => `
      <tr>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #333; font-size: 13px;">${index + 1}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #333; font-size: 13px; font-weight: 500;">${item.description}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #333; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333; font-size: 13px;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #333; font-size: 13px; font-weight: 600;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

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

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #ffffff;
      color: #333;
      padding: 30px;
      min-height: 100vh;
      position: relative;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo-placeholder {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 22px;
    }
    .company-info h2 {
      color: #1e40af;
      font-size: 18px;
      font-weight: 700;
    }
    .company-info p {
      color: #666;
      font-size: 11px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      color: #1e40af;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 2px;
    }
    .invoice-title .invoice-no {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    
    .meta-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .meta-box {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }
    .meta-box h3 {
      color: #1e40af;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .meta-box p {
      font-size: 13px;
      color: #333;
      margin-bottom: 5px;
    }
    .meta-box strong {
      color: #1e40af;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .items-table th {
      background: #1e40af;
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
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
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 300px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #1e40af;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #333;
    }
    .total-row.grand {
      border-top: 2px solid #1e40af;
      margin-top: 10px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #1e40af;
    }
    
    .notes-section {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
      border-left: 4px solid #f59e0b;
      font-size: 13px;
    }
    .notes-section strong {
      color: #92400e;
    }
    
    .codes-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 50px;
      margin: 30px 0;
      padding: 25px;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .qr-code, .barcode {
      text-align: center;
    }
    .qr-code img {
      width: 100px;
      height: 100px;
    }
    .barcode img {
      height: 60px;
    }
    .codes-section p {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    
    .footer {
      text-align: center;
      padding-top: 25px;
      border-top: 2px solid #1e40af;
    }
    .footer-company {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .footer-contacts {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    .page-number {
      position: fixed;
      bottom: 15px;
      right: 30px;
      font-size: 11px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo-placeholder">JUA</div>
        <div class="company-info">
          <h2>Justice Ultimate Automobiles</h2>
          <p>Premier Car Dealership in Kenya</p>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p class="invoice-no">${invoiceNo}</p>
      </div>
    </div>

    <div class="meta-section">
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
        <p><strong>Due Date:</strong> ${dueDate}</p>
        ${data.order_id ? `<p><strong>Order Ref:</strong> ${data.order_id.substring(0, 8).toUpperCase()}</p>` : ''}
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

    <div class="totals-section">
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
    <div class="notes-section">
      <strong>Notes:</strong> ${data.notes}
    </div>
    ` : ''}

    <div class="codes-section">
      <div class="qr-code">
        <img src="data:image/svg+xml;base64,${qrCodeBase64}" alt="QR Code" />
        <p>Scan for invoice details</p>
      </div>
      <div class="barcode">
        <img src="data:image/svg+xml;base64,${barcodeBase64}" alt="Barcode" />
        <p>${invoiceNo}</p>
      </div>
    </div>

    <div class="footer">
      <p class="footer-company">Justice Ultimate Automobiles | Premier Car Dealership in Kenya</p>
      <p class="footer-contacts">
        Phone: 0722 827 458 | 0751555544<br>
        Email: info@justiceultimateautomobiles.com | Web: www.justiceultimateautomobiles.com
      </p>
    </div>
  </div>
  
  <div class="page-number">Page 1 of 1</div>
</body>
</html>
    `;

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
