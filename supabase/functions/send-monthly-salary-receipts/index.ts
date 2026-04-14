import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    console.log("Monthly salary receipt generation started...");

    // Get all active staff with pending payroll for current month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const { data: payrollRecords, error: payrollErr } = await supabase
      .from("payroll")
      .select("*, staff:staff_id(id, first_name, last_name, email, role, department)")
      .eq("pay_period_start", periodStart)
      .eq("payment_status", "pending");

    if (payrollErr) throw payrollErr;

    if (!payrollRecords || payrollRecords.length === 0) {
      console.log("No pending payroll records for this month");
      return new Response(
        JSON.stringify({ success: true, message: "No pending payroll records", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    for (const record of payrollRecords) {
      try {
        // Invoke generate-salary-receipt for each staff member
        const { error } = await supabase.functions.invoke("generate-salary-receipt", {
          body: { staff_id: record.staff_id, pay_period: periodStart, send_email: true },
        });

        if (!error) {
          // Mark as paid
          await supabase.from("payroll").update({ payment_status: "paid", payment_date: now.toISOString().split("T")[0] }).eq("id", record.id);
          sent++;
          console.log(`Receipt sent for staff ${record.staff?.first_name} ${record.staff?.last_name}`);
        }
      } catch (e) {
        console.error(`Failed for staff ${record.staff_id}:`, e);
      }
    }

    console.log(`Monthly receipts complete: ${sent}/${payrollRecords.length} sent`);

    return new Response(
      JSON.stringify({ success: true, total: payrollRecords.length, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
