import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ViewAnalytics {
  date: string;
  views: number;
}

export const useVehicleAnalytics = (carId: string | undefined) => {
  const [analytics, setAnalytics] = useState<ViewAnalytics[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch view data grouped by date
        const { data, error } = await supabase
          .from("vehicle_views")
          .select("viewed_at")
          .eq("car_id", carId)
          .order("viewed_at", { ascending: true });

        if (error) throw error;

        // Group views by date
        const viewsByDate: { [key: string]: number } = {};
        let total = 0;

        data?.forEach((view) => {
          const date = new Date(view.viewed_at).toLocaleDateString();
          viewsByDate[date] = (viewsByDate[date] || 0) + 1;
          total++;
        });

        // Convert to array format for chart
        const analyticsData = Object.entries(viewsByDate).map(([date, views]) => ({
          date,
          views,
        }));

        setAnalytics(analyticsData);
        setTotalViews(total);
      } catch (error) {
        console.error("Error fetching vehicle analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("vehicle-views-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vehicle_views",
          filter: `car_id=eq.${carId}`,
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carId]);

  return { analytics, totalViews, loading };
};

export const trackVehicleView = async (carId: string, userId?: string) => {
  try {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem("vehicle_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("vehicle_session_id", sessionId);
    }

    const { error } = await supabase.from("vehicle_views").insert({
      car_id: carId,
      user_id: userId || null,
      session_id: sessionId,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error tracking vehicle view:", error);
  }
};
