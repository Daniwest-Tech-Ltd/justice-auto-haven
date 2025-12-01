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
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError) throw reportError;

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("user_id", report.user_id)
      .single();

    // Fetch staff details
    const { data: staff } = await supabase
      .from("staff")
      .select("id, first_name, last_name, role, department, avatar_url")
      .eq("user_id", report.user_id)
      .single();

    // Fetch attendance for the day
    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("staff_id", staff?.id)
      .eq("date", report.date)
      .maybeSingle();

    // Fetch activity logs for the period
    const { data: activities } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", report.user_id)
      .gte("created_at", report.period_start)
      .lte("created_at", report.period_end)
      .order("created_at", { ascending: false });

    // Fetch sessions for the period
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", report.user_id)
      .gte("login_at", report.period_start)
      .lte("login_at", report.period_end);

    // Calculate active hours
    let activeMinutes = 0;
    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const loginTime = new Date(session.login_at);
        const logoutTime = session.logout_at
          ? new Date(session.logout_at)
          : new Date(session.last_activity_at);

        const periodStart = new Date(report.period_start);
        const periodEnd = new Date(report.period_end);

        const sessionStart = loginTime < periodStart ? periodStart : loginTime;
        const sessionEnd = logoutTime > periodEnd ? periodEnd : logoutTime;

        if (sessionEnd > sessionStart) {
          activeMinutes += (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60);
        }
      }
    }

    const activeHours = (activeMinutes / 60).toFixed(2);

    // Count activities by type
    const activityCounts: Record<string, number> = {};
    if (activities) {
      activities.forEach((activity: any) => {
        activityCounts[activity.action_type] = 
          (activityCounts[activity.action_type] || 0) + 1;
      });
    }

    const staffName = staff ? `${staff.first_name} ${staff.last_name}` : profile?.full_name || "Unknown";

    // Generate HTML for PDF with enhanced styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            background: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .report-title {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .report-date {
            font-size: 14px;
            color: #666;
          }
          .staff-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .staff-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #1e40af;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
          .staff-details h2 {
            font-size: 22px;
            color: #333;
            margin-bottom: 5px;
          }
          .staff-details p {
            font-size: 14px;
            color: #666;
            margin: 3px 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }
          .stat-unit {
            font-size: 14px;
            color: #666;
            margin-left: 5px;
          }
          .activities-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .activities-table th {
            background: #1e40af;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
          }
          .activities-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .activities-table tr:hover {
            background: #f8fafc;
          }
          .activity-type {
            font-weight: 600;
            color: #1e40af;
          }
          .activity-breakdown {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 15px;
          }
          .breakdown-item {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .breakdown-label {
            font-size: 14px;
            color: #666;
          }
          .breakdown-value {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-present {
            background: #d1fae5;
            color: #065f46;
          }
          .status-absent {
            background: #fee2e2;
            color: #991b1b;
          }
          .status-late {
            background: #fef3c7;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">JUSTICE ULTIMATE AUTOMOBILES</div>
            <div class="report-title">Daily Activity Report</div>
            <div class="report-date">
              Report Date: ${new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <br>
              Period: ${new Date(report.period_start).toLocaleTimeString()} - ${new Date(report.period_end).toLocaleTimeString()}
            </div>
          </div>

          <div class="staff-info">
            <div class="staff-avatar">
              ${staffName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </div>
            <div class="staff-details">
              <h2>${staffName}</h2>
              <p><strong>Email:</strong> ${profile?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${profile?.phone || 'N/A'}</p>
              <p><strong>Role:</strong> ${staff?.role || 'N/A'}</p>
              <p><strong>Department:</strong> ${staff?.department || 'N/A'}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Performance Summary</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Attendance</div>
                <div class="stat-value">
                  <span class="status-badge status-${attendance?.status || 'absent'}">
                    ${attendance?.status?.toUpperCase() || 'ABSENT'}
                  </span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Active Hours</div>
                <div class="stat-value">
                  ${activeHours}<span class="stat-unit">hrs</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Activities</div>
                <div class="stat-value">
                  ${activities?.length || 0}<span class="stat-unit">actions</span>
                </div>
              </div>
            </div>

            ${attendance ? `
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Clock In</div>
                <div class="stat-value" style="font-size: 20px;">
                  ${attendance.time_in || attendance.clock_in ? new Date(attendance.clock_in || attendance.time_in).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Clock Out</div>
                <div class="stat-value" style="font-size: 20px;">
                  ${attendance.time_out || attendance.clock_out ? new Date(attendance.clock_out || attendance.time_out).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Notes</div>
                <div class="stat-value" style="font-size: 14px;">
                  ${attendance.notes || 'None'}
                </div>
              </div>
            </div>
            ` : ''}
          </div>

          ${Object.keys(activityCounts).length > 0 ? `
          <div class="section">
            <div class="section-title">Activity Breakdown</div>
            <div class="activity-breakdown">
              ${Object.entries(activityCounts).map(([type, count]) => `
                <div class="breakdown-item">
                  <span class="breakdown-label">${type.replace(/_/g, ' ').toUpperCase()}</span>
                  <span class="breakdown-value">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${activities && activities.length > 0 ? `
          <div class="section">
            <div class="section-title">Recent Activities (Last 15)</div>
            <table class="activities-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action Type</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                ${activities.slice(0, 15).map((activity: any) => `
                  <tr>
                    <td>${new Date(activity.created_at).toLocaleTimeString()}</td>
                    <td><span class="activity-type">${activity.action_type.replace(/_/g, ' ')}</span></td>
                    <td>${activity.target_table || 'N/A'}</td>
                    <td style="font-size: 12px; color: #666;">
                      ${activity.details ? JSON.stringify(activity.details).substring(0, 50) + '...' : 'No details'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>Justice Ultimate Automobiles</strong></p>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Contact: Justice Vincent (GM) - 0722827458 | Daniel Maina (Sales Manager) - 0701460110</p>
            <p>Nairobi, Kenya | www.justiceultimateautomobiles.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fileName = `Daily_Report_${staffName.replace(/\s+/g, '_')}_${report.date}.html`;

    return new Response(
      JSON.stringify({
        success: true,
        pdfData: btoa(htmlContent),
        fileName: fileName,
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