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

    console.log("Generating daily reports...");

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    
    // Determine business hours based on day of week
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const startHour = isWeekend ? 9 : 8;
    
    const periodStart = new Date(today);
    periodStart.setHours(startHour, 0, 0, 0);
    
    const periodEnd = new Date(today);
    periodEnd.setHours(16, 0, 0, 0);

    // Get all active users (staff)
    const { data: staffList, error: staffError } = await supabase
      .from("staff")
      .select("id, user_id, first_name, last_name, role, department")
      .eq("status", "active");

    if (staffError) throw staffError;

    let reportsGenerated = 0;

    for (const staff of staffList) {
      if (!staff.user_id) continue;

      // Get attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("staff_id", staff.id)
        .eq("date", dateStr)
        .single();

      // Get activity logs for the period
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", staff.user_id)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString())
        .order("created_at", { ascending: false });

      // Get session data
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", staff.user_id)
        .gte("login_at", periodStart.toISOString())
        .lte("login_at", periodEnd.toISOString());

      // Calculate active hours
      let activeMinutes = 0;
      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const loginTime = new Date(session.login_at);
          const logoutTime = session.logout_at
            ? new Date(session.logout_at)
            : new Date(session.last_activity_at);

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
        activities.forEach((activity) => {
          activityCounts[activity.action_type] = 
            (activityCounts[activity.action_type] || 0) + 1;
        });
      }

      // Generate report data
      const staffName = `${staff.first_name} ${staff.last_name}`;
      const reportData = {
        date: dateStr,
        staff_name: staffName,
        role: staff.role,
        department: staff.department,
        attendance_status: attendance?.status || "absent",
        time_in: attendance?.time_in || null,
        time_out: attendance?.time_out || null,
        active_hours: activeHours,
        total_activities: activities?.length || 0,
        activity_breakdown: activityCounts,
        activities_summary: activities?.slice(0, 10).map((a) => ({
          type: a.action_type,
          time: a.created_at,
          details: a.details,
        })) || [],
      };

      // Store report (in production, this would be a PDF file path)
      const reportPath = `reports/${dateStr}/${staff.user_id}.json`;
      
      const { error: reportError } = await supabase
        .from("daily_reports")
        .upsert({
          user_id: staff.user_id,
          date: dateStr,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          file_path: reportPath,
          generated_by: null, // System generated
        }, {
          onConflict: "user_id,date",
        });

      if (reportError) {
        console.error(`Error saving report for ${staffName}:`, reportError);
      } else {
        reportsGenerated++;
        console.log(`Report generated for ${staffName}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${reportsGenerated} reports`,
        date: dateStr,
        period: `${startHour}:00 - 16:00`,
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
