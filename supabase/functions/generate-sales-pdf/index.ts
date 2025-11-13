import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all sales with car and customer details
    const { data: sales, error } = await supabase
      .from("sales")
      .select(`
        *,
        cars (make, model, year, stock_id),
        profiles:customer_id (full_name, email, phone)
      `)
      .order("sale_date", { ascending: false });

    if (error) throw error;

    // Calculate totals
    const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0;
    const totalSales = sales?.length || 0;

    // Generate HTML for PDF with better styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sales Report - Justice Ultimate Automobiles</title>
        <style>
          @page { 
            size: A4; 
            margin: 20mm;
          }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 0; 
            margin: 0;
            color: #1a1a1a; 
            background: white;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(0, 0, 0, 0.05);
            font-weight: bold;
            z-index: -1;
            white-space: nowrap;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 4px solid #1a1a1a; 
            padding-bottom: 20px; 
          }
          .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1a1a1a; 
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .subtitle { 
            color: #666; 
            font-size: 16px; 
            font-weight: 500;
          }
          .date { 
            color: #999; 
            font-size: 12px; 
            margin-top: 8px;
          }
          .summary { 
            display: flex; 
            justify-content: space-around; 
            margin: 30px 0; 
            padding: 25px; 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .summary-item { 
            text-align: center; 
          }
          .summary-label { 
            font-size: 13px; 
            color: #666; 
            text-transform: uppercase; 
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .summary-value { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1a1a1a; 
            margin-top: 8px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th { 
            background: #1a1a1a; 
            color: white; 
            padding: 14px 12px; 
            text-align: left; 
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #e0e0e0;
            font-size: 13px;
          }
          tr:nth-child(even) { 
            background: #f8f9fa; 
          }
          tr:hover { 
            background: #e9ecef; 
          }
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 2px solid #ddd; 
            text-align: center; 
            color: #666; 
            font-size: 12px;
          }
          .footer strong {
            color: #1a1a1a;
            font-size: 14px;
          }
          .footer-powered {
            font-style: italic;
            font-size: 10px;
            color: #999;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">JUSTICE ULTIMATE</div>
        <div class="header">
          <div class="logo">JUSTICE ULTIMATE AUTOMOBILES</div>
          <div class="subtitle">Sales Performance Report</div>
          <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value">${totalSales}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">KSh ${totalRevenue.toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Avg Sale Price</div>
            <div class="summary-value">KSh ${(totalRevenue / totalSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Stock ID</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Sale Price</th>
            </tr>
          </thead>
          <tbody>
            ${sales?.map(sale => `
              <tr>
                <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                <td><strong>${sale.cars?.stock_id || 'N/A'}</strong></td>
                <td>${sale.cars?.year} ${sale.cars?.make} ${sale.cars?.model}</td>
                <td>
                  <div><strong>${sale.profiles?.full_name || 'N/A'}</strong></div>
                  <div style="font-size: 11px; color: #666;">${sale.profiles?.email || ''}</div>
                </td>
                <td>${sale.payment_type || 'N/A'}</td>
                <td><strong>KSh ${Number(sale.sale_price).toLocaleString()}</strong></td>
              </tr>
            `).join('') || '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">No sales records found</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Justice Ultimate Automobiles</strong></p>
          <p>📍 Mpesi Lane 11, Westlands, Nairobi, Kenya</p>
          <p>📞 +254 722 827 458 | ✉️ info@justiceultimateauto.com</p>
          <p style="margin-top: 15px; font-size: 11px;">This document is confidential and intended for internal use only.</p>
          <p class="footer-powered">Powered By Daniwest Tech Sol</p>
        </div>
      </body>
      </html>
    `;

    // Return HTML content as base64
    const encoder = new TextEncoder();
    const data = encoder.encode(htmlContent);
    const base64 = btoa(String.fromCharCode(...data));

    return new Response(
      JSON.stringify({
        success: true,
        pdfData: base64,
        fileName: `sales_report_${new Date().toISOString().split('T')[0]}.html`,
        totalSales,
        totalRevenue,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
