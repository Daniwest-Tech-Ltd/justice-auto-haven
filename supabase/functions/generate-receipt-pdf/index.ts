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

// Code 39 Barcode Generator - Proper implementation
function generateBarcodeSVG(code: string): string {
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
    '-': '100101011011', '*': '100101101101', ' ': '100110101101'
  };
  
  const barWidth = 1.5;
  const height = 50;
  let x = 10;
  let bars = '';
  
  const safeCode = '*' + code.toUpperCase().replace(/[^0-9A-Z-\s]/g, '').substring(0, 20) + '*';
  
  for (const char of safeCode) {
    const pattern = patterns[char] || patterns['0'];
    for (const bit of pattern) {
      if (bit === '1') {
        bars += `<rect x="${x}" y="10" width="${barWidth}" height="${height}" fill="#000"/>`;
      }
      x += barWidth;
    }
    x += barWidth * 3;
  }
  
  const totalWidth = x + 10;
  return `<svg width="${totalWidth}" height="${height + 35}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${totalWidth}" height="${height + 35}" fill="white"/>
    ${bars}
    <text x="${totalWidth/2}" y="${height + 25}" text-anchor="middle" font-family="monospace" font-size="11" fill="#000">${code}</text>
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

    // Generate REAL QR code with receipt URL using qrcode library
    const receiptUrl = `https://justiceultimateautomobiles.com/receipts/${receiptNo}`;
    console.log("Generating QR code for URL:", receiptUrl);
    
    // Generate QR code as SVG string
    const qrCodeSVG = await QRCode.toString(receiptUrl, {
      type: 'svg',
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    const qrCodeBase64 = btoa(unescape(encodeURIComponent(qrCodeSVG)));
    console.log("QR code generated successfully");

    // Generate barcode
    const barcodeId = receiptNo.replace(/[^0-9A-Z]/gi, '').substring(0, 15).toUpperCase();
    const barcodeSVG = generateBarcodeSVG(barcodeId);
    const barcodeBase64 = btoa(unescape(encodeURIComponent(barcodeSVG)));

    // Company logo URL
    const logoUrl = "https://preview--jua-auto-dealership.lovable.app/images/company-logo.png";

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

    // Generate HTML receipt
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
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .company-logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: contain;
      background: white;
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
    .receipt-badge {
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      padding: 10px 25px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .detail-box {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }
    .detail-box h3 {
      color: #1e40af;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .detail-box p {
      font-size: 13px;
      color: #333;
      margin-bottom: 5px;
    }
    .detail-box strong {
      color: #1e40af;
    }
    .detail-box .name {
      font-size: 16px;
      font-weight: 600;
      color: #1e40af;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
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
    .items-table td {
      padding: 15px;
      font-size: 14px;
      color: #333;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    .items-table .total-row {
      background: #f8fafc;
    }
    .items-table .total-row td {
      font-weight: 700;
      color: #1e40af;
      font-size: 16px;
    }
    
    .codes-section {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 50px;
      margin: 30px 0;
      padding: 25px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .qr-code, .barcode {
      text-align: center;
    }
    .qr-code img {
      width: 130px;
      height: 130px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 5px;
      background: white;
    }
    .barcode img {
      height: 70px;
    }
    .codes-section p {
      font-size: 11px;
      color: #333;
      margin-top: 8px;
      font-weight: 500;
    }
    .codes-section .scan-text {
      color: #1e40af;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      padding: 25px;
      background: #1e40af;
      border-radius: 8px;
      margin-top: 30px;
    }
    .footer-company {
      font-size: 16px;
      font-weight: 700;
      color: white;
      margin-bottom: 10px;
    }
    .footer-contacts {
      font-size: 13px;
      color: rgba(255,255,255,0.9);
      line-height: 1.8;
    }
    .footer-contacts a {
      color: white;
      text-decoration: none;
    }
    .payment-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 15px;
    }
    .page-number {
      text-align: center;
      margin-top: 20px;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-section">
        <img src="${logoUrl}" alt="JUA Logo" class="company-logo" onerror="this.style.display='none'" />
        <div class="company-info">
          <h2>Justice Ultimate Automobiles</h2>
          <p>Premier Car Dealership in Kenya</p>
        </div>
      </div>
      <div class="receipt-badge">✓ Payment Receipt</div>
    </div>

    <div class="details-grid">
      <div class="detail-box">
        <h3>Paid To</h3>
        <p class="name">Justice Ultimate Automobiles</p>
        <p>Premier Car Dealership</p>
        <p>Nairobi, Kenya</p>
      </div>
      <div class="detail-box">
        <h3>Receipt Details</h3>
        <p><strong>Receipt No:</strong> ${receiptNo}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        ${data.payment_reference ? `<p><strong>Ref:</strong> ${data.payment_reference}</p>` : ''}
      </div>
    </div>

    <div class="detail-box" style="margin-bottom: 25px;">
      <h3>Paid By</h3>
      <p class="name">${data.customer_name}</p>
      ${data.customer_email ? `<p>${data.customer_email}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Payment Method</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${data.description || 'Payment'}${invoiceNo ? ` (${invoiceNo})` : ''}</td>
          <td>${data.payment_method === 'mpesa' ? 'M-Pesa' : data.payment_method.charAt(0).toUpperCase() + data.payment_method.slice(1)}</td>
          <td>${formatCurrency(data.amount_paid)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2"><strong>Total Paid</strong></td>
          <td><strong>${formatCurrency(data.amount_paid)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="codes-section">
      <div class="qr-code">
        <img src="data:image/svg+xml;base64,${qrCodeBase64}" alt="QR Code - Scan to view receipt" />
        <p class="scan-text">📱 Scan to view receipt online</p>
        <p>${receiptUrl}</p>
      </div>
      <div class="barcode">
        <img src="data:image/svg+xml;base64,${barcodeBase64}" alt="Barcode" />
        <p><strong>${receiptNo}</strong></p>
      </div>
    </div>

    <div class="footer">
      <p class="footer-company">Justice Ultimate Automobiles | Premier Car Dealership in Kenya</p>
      <p class="footer-contacts">
        📞 Phone: 0722 827 458 | 0751555544<br>
        ✉️ Email: info@justiceultimateautomobiles.com<br>
        🌐 Web: www.justiceultimateautomobiles.com
      </p>
      <div class="payment-badge">✓ PAYMENT CONFIRMED</div>
    </div>

    <p class="page-number">Page 1 of 1 | Generated on ${formattedDate} at ${formattedTime}</p>
  </div>
</body>
</html>
    `;

    console.log("Receipt generated successfully:", receiptNo);

    return new Response(
      JSON.stringify({
        success: true,
        receipt_id: receipt.id,
        receipt_no: receiptNo,
        html: receiptHtml,
        qr_code_url: receiptUrl
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error generating receipt:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
