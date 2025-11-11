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

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sales Report - Justice Ultimate Automobiles</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 14px; }
          .summary { display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .summary-value { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1a1a1a; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f9f9f9; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
          .date { color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">JUSTICE ULTIMATE AUTOMOBILES</div>
          <div class="subtitle">Sales Report</div>
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
              <th>Payment Type</th>
              <th>Sale Price</th>
            </tr>
          </thead>
          <tbody>
            ${sales?.map(sale => `
              <tr>
                <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                <td>${sale.cars?.stock_id || 'N/A'}</td>
                <td>${sale.cars?.year} ${sale.cars?.make} ${sale.cars?.model}</td>
                <td>
                  <div><strong>${sale.profiles?.full_name || 'N/A'}</strong></div>
                  <div style="font-size: 11px; color: #666;">${sale.profiles?.email || ''}</div>
                </td>
                <td>${sale.payment_type || 'N/A'}</td>
                <td><strong>KSh ${Number(sale.sale_price).toLocaleString()}</strong></td>
              </tr>
            `).join('') || '<tr><td colspan="6" style="text-align: center; padding: 20px;">No sales records found</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Justice Ultimate Automobiles</strong></p>
          <p>This document is confidential and intended for internal use only.</p>
          <p style="margin-top: 10px; color: #999;">Contact: info@justiceultimateauto.com | Tel: +254 XXX XXX XXX</p>
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