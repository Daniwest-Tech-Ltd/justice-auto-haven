import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptRequest {
  invoice_id?: string;
  payment_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  amount_paid: number;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
  description?: string;
}

// Company logo URL
const companyLogoUrl = "https://ccsfhblxkmyqdqqcgitt.supabase.co/storage/v1/object/public/brand-logos/jua-logo.png";

// Generate barcode SVG
function generateBarcodeSVG(code: string): string {
  const barWidth = 2;
  const height = 50;
  let x = 0;
  let bars = '';
  
  // Simple Code 39 encoding
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
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = today.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format currency
    const formatCurrency = (amount: number) => {
      return 'KES ' + new Intl.NumberFormat('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    // Get invoice details if provided
    let invoiceNo = '';
    if (data.invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('invoice_no')
        .eq('id', data.invoice_id)
        .single();
      if (invoice) invoiceNo = invoice.invoice_no;
    }

    // Generate QR code with receipt URL
    const receiptUrl = `https://justiceultimateautomobiles.com/receipts/${receiptNo}`;
    const qrCodeDataUrl = await QRCode.toDataURL(receiptUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#1e40af', light: '#ffffff' }
    });

    // Generate barcode
    const barcodeId = receiptNo.replace(/[^0-9A-Z]/gi, '').toUpperCase();
    const barcodeSVG = generateBarcodeSVG(barcodeId);
    const barcodeBase64 = btoa(barcodeSVG);

    // Store receipt in database first to get the ID
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

    // Generate HTML receipt matching the Pesapal style from screenshot
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receiptNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #ffffff;
      color: #333;
      padding: 40px;
      min-height: 100vh;
      position: relative;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #1e40af;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 24px;
      border: 3px solid #1e40af;
    }
    .pesapal-logo {
      color: #1e40af;
      font-size: 28px;
      font-weight: 300;
    }
    .pesapal-logo span { color: #f97316; font-weight: 600; }
    
    .paid-to-section {
      margin-bottom: 30px;
    }
    .paid-to-section h3 {
      color: #333;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .paid-to-section .company {
      color: #3b82f6;
      font-size: 16px;
      font-weight: 500;
    }
    .paid-to-section .country {
      color: #666;
      font-size: 14px;
    }
    
    .payment-details {
      text-align: right;
      margin-bottom: 30px;
    }
    .payment-details p {
      font-size: 13px;
      color: #666;
      margin-bottom: 3px;
    }
    .payment-details strong {
      color: #333;
    }
    
    .paid-by-section {
      margin-bottom: 30px;
    }
    .paid-by-section h3 {
      color: #333;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .paid-by-section .name {
      color: #3b82f6;
      font-size: 16px;
      font-weight: 500;
    }
    .paid-by-section .email {
      color: #3b82f6;
      font-size: 14px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f8f9fa;
      padding: 12px 15px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e5e7eb;
    }
    .items-table th:last-child {
      text-align: right;
    }
    .items-table td {
      padding: 12px 15px;
      font-size: 13px;
      color: #333;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table td:last-child {
      text-align: right;
    }
    .items-table .total-row td {
      font-weight: 700;
      background: #f8f9fa;
    }
    
    .codes-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 40px;
      margin: 40px 0;
      padding: 30px;
      border-top: 1px solid #e5e7eb;
    }
    .qr-code {
      text-align: center;
    }
    .qr-code img {
      width: 100px;
      height: 100px;
    }
    .qr-code p {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    .barcode {
      text-align: center;
    }
    .barcode img {
      height: 60px;
    }
    .barcode p {
      font-size: 10px;
      color: #666;
      margin-top: 5px;
    }
    
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #1e40af;
      margin-top: 40px;
      position: relative;
    }
    .footer-company {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .footer-contacts {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    .page-number {
      position: fixed;
      bottom: 20px;
      right: 40px;
      font-size: 11px;
      color: #999;
    }
    
    .pesapal-badge {
      display: inline-block;
      background: #1e40af;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <div class="logo-placeholder">JUA</div>
      </div>
      <div class="pesapal-logo">pesa<span>pal</span></div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div class="paid-to-section">
        <h3>Paid To:</h3>
        <p class="company">Justice Ultimate Automobiles</p>
        <p class="country">Kenya</p>
      </div>
      <div class="payment-details">
        <p>Payment No: <strong>${data.payment_reference || receipt.id.substring(0, 12)}</strong></p>
        <p>Reference No: <strong>${receiptNo}</strong></p>
        ${data.payment_reference ? `<p>Confirmation No: <strong>${data.payment_reference}</strong></p>` : ''}
        <p>Date: <strong>${formattedDate}</strong></p>
      </div>
    </div>

    <div class="paid-by-section">
      <h3>Paid By:</h3>
      <p class="name">${data.customer_name}</p>
      ${data.customer_email ? `<p class="email">${data.customer_email}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Payment Method</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.description || 'Payment'}${data.payment_reference ? ' - ' + data.payment_reference : ''}</td>
          <td>${data.payment_method === 'mpesa' ? 'M-Pesa' : data.payment_method.charAt(0).toUpperCase() + data.payment_method.slice(1)}</td>
          <td>${formatCurrency(data.amount_paid)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Total</td>
          <td>${formatCurrency(data.amount_paid)}</td>
        </tr>
      </tbody>
    </table>

    <div class="codes-section">
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="QR Code" />
        <p>Scan for receipt details</p>
      </div>
      <div class="barcode">
        <img src="data:image/svg+xml;base64,${barcodeBase64}" alt="Barcode" />
        <p>${receiptNo}</p>
      </div>
    </div>

    <div class="footer">
      <p class="footer-company">Justice Ultimate Automobiles | Premier Car Dealership in Kenya</p>
      <p class="footer-contacts">
        Phone: 0722 827 458 | 0751555544<br>
        Email: info@justiceultimateautomobiles.com | Web: www.justiceultimateautomobiles.com
      </p>
      <div class="pesapal-badge">✓ PAID VIA PESAPAL</div>
    </div>
  </div>
  
  <div class="page-number">Page 1 of 1</div>
</body>
</html>
    `;

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
