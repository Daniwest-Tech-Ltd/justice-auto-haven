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

    console.log("Creating daily attendance records...");

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Call the function to create attendance
    const { data, error } = await supabase.rpc("create_daily_attendance", {
      attendance_date: today,
    });

    if (error) {
      console.error("Error creating attendance:", error);
      throw error;
    }

    console.log(`Created ${data} attendance records for ${today}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${data} attendance records`,
        date: today,
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
