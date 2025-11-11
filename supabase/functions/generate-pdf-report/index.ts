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

    const { reportId } = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    // Fetch the report data
    const { data: report, error: reportError } = await supabase
      .from("daily_reports")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq("id", reportId)
      .single();

    if (reportError) throw reportError;

    // Fetch staff info
    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", report.user_id)
      .single();

    // Fetch attendance
    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("staff_id", staff?.id)
      .eq("date", report.date)
      .single();

    // Fetch activities
    const { data: activities } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", report.user_id)
      .gte("created_at", report.period_start)
      .lte("created_at", report.period_end)
      .order("created_at", { ascending: false });

    // Generate PDF content (HTML)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Report - ${report.profiles?.full_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #1a1a1a; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .section h2 { color: #333; margin-top: 0; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f0f0f0; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Daily Activity Report</h1>
          <p>${new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="section">
          <h2>Employee Information</h2>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">${report.profiles?.full_name}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${report.profiles?.email}</span>
          </div>
          <div class="info-row">
            <span class="label">Position:</span>
            <span class="value">${staff?.position || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Department:</span>
            <span class="value">${staff?.department || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <h2>Attendance Summary</h2>
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="value">${attendance?.status || 'No record'}</span>
          </div>
          <div class="info-row">
            <span class="label">Time In:</span>
            <span class="value">${attendance?.time_in || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Time Out:</span>
            <span class="value">${attendance?.time_out || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Report Period:</span>
            <span class="value">${new Date(report.period_start).toLocaleTimeString()} - ${new Date(report.period_end).toLocaleTimeString()}</span>
          </div>
        </div>

        <div class="section">
          <h2>Activity Log</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action Type</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${activities?.map(activity => `
                <tr>
                  <td>${new Date(activity.created_at).toLocaleTimeString()}</td>
                  <td>${activity.action_type}</td>
                  <td>${activity.target_table || 'N/A'}</td>
                  <td>${JSON.stringify(activity.details || {})}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No activities recorded</td></tr>'}
            </tbody>
          </table>
          <p><strong>Total Activities:</strong> ${activities?.length || 0}</p>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Justice Ultimate Automobiles - Confidential</p>
        </div>
      </body>
      </html>
    `;

    // Return PDF as base64
    const encoder = new TextEncoder();
    const data = encoder.encode(htmlContent);
    const base64 = btoa(String.fromCharCode(...data));

    return new Response(
      JSON.stringify({
        success: true,
        pdfData: base64,
        fileName: `report_${report.profiles?.full_name}_${report.date}.html`,
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