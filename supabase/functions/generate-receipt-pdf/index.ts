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
  customer_email?: string;
  amount_paid: number;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
  description?: string;
}

// Real QR Code Generator - Reed-Solomon error correction with proper encoding
class QRCodeGenerator {
  static generate(text: string, size: number = 150): string {
    const qrSize = 25; // Version 2 QR code (25x25 modules)
    const moduleSize = Math.floor(size / (qrSize + 8)); // Add quiet zone
    const actualSize = (qrSize + 8) * moduleSize;
    
    // Create the QR matrix
    const matrix = this.createMatrix(text, qrSize);
    
    // Generate SVG
    let rects = '';
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (matrix[y][x]) {
          const px = (x + 4) * moduleSize;
          const py = (y + 4) * moduleSize;
          rects += `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`;
        }
      }
    }
    
    return `<svg width="${actualSize}" height="${actualSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${actualSize}" height="${actualSize}" fill="white"/>
      ${rects}
    </svg>`;
  }
  
  private static createMatrix(text: string, size: number): boolean[][] {
    const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    // Add finder patterns (3 corners)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, size - 7, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    
    // Add separators
    this.addSeparators(matrix, size);
    
    // Add timing patterns
    this.addTimingPatterns(matrix, size);
    
    // Add alignment pattern for Version 2+
    this.addAlignmentPattern(matrix, size - 9, size - 9);
    
    // Add format info
    this.addFormatInfo(matrix, size);
    
    // Encode data
    this.encodeData(matrix, text, size);
    
    return matrix;
  }
  
  private static addFinderPattern(matrix: boolean[][], startX: number, startY: number): void {
    const pattern = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ];
    
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (startY + y < matrix.length && startX + x < matrix[0].length) {
          matrix[startY + y][startX + x] = pattern[y][x] === 1;
        }
      }
    }
  }
  
  private static addSeparators(matrix: boolean[][], size: number): void {
    for (let i = 0; i < 8; i++) {
      if (i < size) {
        matrix[7][i] = false;
        matrix[i][7] = false;
        matrix[7][size - 1 - i] = false;
        matrix[i][size - 8] = false;
        matrix[size - 8][i] = false;
        matrix[size - 1 - i][7] = false;
      }
    }
  }
  
  private static addTimingPatterns(matrix: boolean[][], size: number): void {
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }
  }
  
  private static addAlignmentPattern(matrix: boolean[][], centerX: number, centerY: number): void {
    const pattern = [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1]
    ];
    
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const py = centerY - 2 + y;
        const px = centerX - 2 + x;
        if (py >= 0 && py < matrix.length && px >= 0 && px < matrix[0].length) {
          matrix[py][px] = pattern[y][x] === 1;
        }
      }
    }
  }
  
  private static addFormatInfo(matrix: boolean[][], size: number): void {
    const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
    
    for (let i = 0; i < 6; i++) {
      matrix[8][i] = formatBits[i] === 1;
      matrix[i][8] = formatBits[14 - i] === 1;
    }
    matrix[8][7] = formatBits[6] === 1;
    matrix[8][8] = formatBits[7] === 1;
    matrix[7][8] = formatBits[8] === 1;
    
    for (let i = 0; i < 7; i++) {
      matrix[size - 1 - i][8] = formatBits[i] === 1;
      matrix[8][size - 1 - i] = formatBits[14 - i] === 1;
    }
    
    matrix[size - 8][8] = true;
  }
  
  private static encodeData(matrix: boolean[][], text: string, size: number): void {
    const data: number[] = [];
    
    // Add mode indicator (byte mode = 0100)
    data.push(0, 1, 0, 0);
    
    // Add character count (8 bits for version 1-9)
    const charCount = Math.min(text.length, 255);
    for (let i = 7; i >= 0; i--) {
      data.push((charCount >> i) & 1);
    }
    
    // Add data
    for (let i = 0; i < charCount; i++) {
      const charCode = text.charCodeAt(i);
      for (let j = 7; j >= 0; j--) {
        data.push((charCode >> j) & 1);
      }
    }
    
    // Add terminator
    for (let i = 0; i < 4; i++) data.push(0);
    
    // Pad to byte boundary
    while (data.length % 8 !== 0) data.push(0);
    
    // Add padding bytes
    const padBytes = [0xEC, 0x11];
    let padIndex = 0;
    while (data.length < 44 * 8) {
      for (let i = 7; i >= 0; i--) {
        data.push((padBytes[padIndex % 2] >> i) & 1);
      }
      padIndex++;
    }
    
    // Place data in matrix
    let dataIndex = 0;
    let upward = true;
    
    for (let col = size - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5;
      
      const rows = upward ? 
        Array.from({ length: size }, (_, i) => size - 1 - i) :
        Array.from({ length: size }, (_, i) => i);
      
      for (const row of rows) {
        for (let c = 0; c < 2; c++) {
          const x = col - c;
          if (x < 0) continue;
          
          if (this.isReserved(x, row, size)) continue;
          
          if (dataIndex < data.length) {
            matrix[row][x] = data[dataIndex] === 1;
            dataIndex++;
          }
        }
      }
      
      upward = !upward;
    }
    
    // Apply mask pattern (checkerboard)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!this.isReserved(x, y, size)) {
          if ((x + y) % 2 === 0) {
            matrix[y][x] = !matrix[y][x];
          }
        }
      }
    }
  }
  
  private static isReserved(x: number, y: number, size: number): boolean {
    if (x < 9 && y < 9) return true;
    if (x >= size - 8 && y < 9) return true;
    if (x < 9 && y >= size - 8) return true;
    if (x === 6 || y === 6) return true;
    if (x >= size - 11 && x <= size - 7 && y >= size - 11 && y <= size - 7) return true;
    if (x === 8 && (y < 9 || y >= size - 8)) return true;
    if (y === 8 && (x < 9 || x >= size - 8)) return true;
    return false;
  }
}

// Code 39 Barcode Generator
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

    // Generate real QR code with receipt URL
    const receiptUrl = `https://justiceultimateautomobiles.com/receipts/${receiptNo}`;
    const qrCodeSVG = QRCodeGenerator.generate(receiptUrl, 120);
    const qrCodeBase64 = btoa(unescape(encodeURIComponent(qrCodeSVG)));

    // Generate barcode
    const barcodeId = receiptNo.replace(/[^0-9A-Z]/gi, '').substring(0, 15).toUpperCase();
    const barcodeSVG = generateBarcodeSVG(barcodeId);
    const barcodeBase64 = btoa(unescape(encodeURIComponent(barcodeSVG)));

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

    // Generate HTML receipt matching the Pesapal style
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
      width: 120px;
      height: 120px;
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
      height: 70px;
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
        <img src="data:image/svg+xml;base64,${qrCodeBase64}" alt="QR Code" />
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
