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

    console.log("Checking for smart notification triggers...");

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();

    // Get all admin users
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];

    let notificationsCreated = 0;

    // Check for absences (run at 9 AM)
    if (currentHour === 9) {
      const { data: absences } = await supabase
        .from("attendance")
        .select("*, staff(full_name)")
        .eq("date", today)
        .eq("status", "absent");

      for (const absence of absences || []) {
        for (const adminId of adminUserIds) {
          await supabase.from("notifications").insert({
            user_id: adminId,
            type: "warning",
            title: "Staff Absence Alert",
            message: `${absence.staff?.full_name} is marked absent today`,
            metadata: {
              staff_id: absence.staff_id,
              date: today,
              type: "absence"
            }
          });
        }
        notificationsCreated++;
      }
    }

    // Check for late check-ins (run at 9 AM and 10 AM)
    if (currentHour === 9 || currentHour === 10) {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*, staff(full_name)")
        .eq("date", today)
        .eq("status", "pending");

      for (const record of attendance || []) {
        for (const adminId of adminUserIds) {
          await supabase.from("notifications").insert({
            user_id: adminId,
            type: "warning",
            title: "Late Check-in Alert",
            message: `${record.staff?.full_name} has not checked in yet`,
            metadata: {
              staff_id: record.staff_id,
              date: today,
              type: "late_checkin"
            }
          });
        }
        notificationsCreated++;
      }
    }

    // Check for important activities (run every hour during business hours)
    if (currentHour >= 8 && currentHour <= 16) {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      // Check for new car additions
      const { data: newCars } = await supabase
        .from("activity_logs")
        .select("*, profiles(full_name)")
        .eq("action_type", "add_car")
        .gte("created_at", oneHourAgo);

      for (const activity of newCars || []) {
        for (const adminId of adminUserIds) {
          await supabase.from("notifications").insert({
            user_id: adminId,
            type: "info",
            title: "New Car Added",
            message: `${activity.profiles?.full_name} added a new car to inventory`,
            metadata: {
              activity_id: activity.id,
              type: "new_car"
            }
          });
        }
        notificationsCreated++;
      }

      // Check for new staff additions
      const { data: newStaff } = await supabase
        .from("activity_logs")
        .select("*, profiles(full_name)")
        .eq("action_type", "add_staff")
        .gte("created_at", oneHourAgo);

      for (const activity of newStaff || []) {
        for (const adminId of adminUserIds) {
          await supabase.from("notifications").insert({
            user_id: adminId,
            type: "info",
            title: "New Staff Member Added",
            message: `${activity.profiles?.full_name} added a new staff member`,
            metadata: {
              activity_id: activity.id,
              type: "new_staff"
            }
          });
        }
        notificationsCreated++;
      }

      // Check for car approvals
      const { data: approvals } = await supabase
        .from("activity_logs")
        .select("*, profiles(full_name)")
        .eq("action_type", "approve_car")
        .gte("created_at", oneHourAgo);

      for (const activity of approvals || []) {
        for (const adminId of adminUserIds) {
          await supabase.from("notifications").insert({
            user_id: adminId,
            type: "success",
            title: "Car Approved",
            message: `${activity.profiles?.full_name} approved a car listing`,
            metadata: {
              activity_id: activity.id,
              type: "car_approval"
            }
          });
        }
        notificationsCreated++;
      }
    }

    console.log(`Created ${notificationsCreated} smart notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notificationsCreated,
        checked_at: now.toISOString(),
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
