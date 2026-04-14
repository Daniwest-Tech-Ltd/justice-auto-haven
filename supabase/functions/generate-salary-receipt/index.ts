import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalaryReceiptRequest {
  staff_id: string;
  pay_period?: string;
  send_email?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { staff_id, pay_period, send_email = true }: SalaryReceiptRequest = await req.json();

    // Get staff info
    const { data: staffData, error: staffErr } = await supabase
      .from("staff")
      .select("*")
      .eq("id", staff_id)
      .single();

    if (staffErr || !staffData) throw new Error("Staff not found");

    // Get latest payroll for this staff
    let payrollQuery = supabase.from("payroll").select("*").eq("staff_id", staff_id);
    if (pay_period) {
      payrollQuery = payrollQuery.eq("pay_period_start", pay_period);
    }
    const { data: payrollData } = await payrollQuery.order("pay_period_start", { ascending: false }).limit(1).single();

    if (!payrollData) throw new Error("No payroll record found");

    // Generate receipt number
    const { data: receiptNo } = await supabase.rpc("generate_salary_receipt_number");
    const receiptNumber = receiptNo || `JUA-SAL-${Date.now()}`;

    const netPay = (payrollData.basic_salary || 0) + (payrollData.allowances || 0) - (payrollData.deductions || 0);
    const periodStart = new Date(payrollData.pay_period_start).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
    const periodEnd = new Date(payrollData.pay_period_end).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

    // Save receipt record
    await supabase.from("salary_receipts").insert({
      staff_id,
      payroll_id: payrollData.id,
      receipt_number: receiptNumber,
      pay_period: `${payrollData.pay_period_start} to ${payrollData.pay_period_end}`,
      basic_salary: payrollData.basic_salary,
      allowances: payrollData.allowances || 0,
      deductions: payrollData.deductions || 0,
      net_pay: netPay,
      sent_at: send_email ? new Date().toISOString() : null,
    });

    // Generate HTML receipt (for PDF-like email)
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; }
          .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
          .badge { background: #22c55e; color: white; padding: 8px 20px; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 14px; margin: 15px 0; }
          .content { padding: 30px; }
          .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #6b7280; font-size: 14px; }
          .info-value { font-weight: 600; font-size: 14px; }
          .total-box { background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .total-box .label { font-size: 14px; opacity: 0.9; }
          .total-box .value { font-size: 28px; font-weight: bold; margin-top: 5px; }
          .breakdown { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 15px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .footer a { color: #dc2626; }
          .watermark { position: relative; }
          .watermark::after { content: "JUSTICE ULTIMATE AUTOMOBILES"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 48px; opacity: 0.03; font-weight: bold; pointer-events: none; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>JUSTICE ULTIMATE AUTOMOBILES</h1>
            <p>Salary Receipt</p>
            <div class="badge">✓ SALARY PAID</div>
          </div>
          <div class="content watermark">
            <div class="info-row">
              <span class="info-label">Receipt Number:</span>
              <span class="info-value">${receiptNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employee:</span>
              <span class="info-value">${staffData.first_name} ${staffData.last_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Position:</span>
              <span class="info-value" style="text-transform:capitalize">${(staffData.role || '').replace(/_/g, ' ')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Department:</span>
              <span class="info-value">${staffData.department || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pay Period:</span>
              <span class="info-value">${periodStart} — ${periodEnd}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date Issued:</span>
              <span class="info-value">${new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            
            <div class="breakdown">
              <div class="info-row">
                <span class="info-label">Basic Salary:</span>
                <span class="info-value">KES ${(payrollData.basic_salary || 0).toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Allowances:</span>
                <span class="info-value">+ KES ${(payrollData.allowances || 0).toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Deductions:</span>
                <span class="info-value">- KES ${(payrollData.deductions || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div class="total-box">
              <div class="label">Net Pay</div>
              <div class="value">KES ${netPay.toLocaleString()}</div>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; text-align: center;">
              This is an official salary receipt from Justice Ultimate Automobiles. Please keep it for your records.
            </p>
          </div>
          <div class="footer">
            <p><strong>Justice Ultimate Automobiles</strong></p>
            <p>Phone: 0722 827 458 | 0701 460 110</p>
            <p>Email: <a href="mailto:info@justiceultimateautomobiles.com">info@justiceultimateautomobiles.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to staff
    if (send_email && staffData.email && RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Justice Ultimate Automobiles <noreply@justiceultimateautomobiles.com>",
          to: [staffData.email],
          subject: `Salary Receipt - ${receiptNumber} | ${periodStart} — ${periodEnd}`,
          html: receiptHtml,
        }),
      });

      if (!resendResponse.ok) {
        const err = await resendResponse.text();
        console.error("Resend error:", err);
      } else {
        console.log(`Salary receipt sent to ${staffData.email}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, receipt_number: receiptNumber, html: receiptHtml }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
