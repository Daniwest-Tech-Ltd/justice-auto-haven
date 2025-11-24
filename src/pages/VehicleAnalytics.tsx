import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, TrendingUp, Car } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingScreen";

interface CarAnalytics {
  car_id: string;
  make: string;
  model: string;
  year: number;
  stock_id: string;
  total_views: number;
  views_by_date: { date: string; views: number }[];
}

const VehicleAnalytics = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CarAnalytics[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    if (role && role.role !== "admin") {
      navigate("/unauthorized");
      return;
    }

    if (role?.role === "admin") {
      fetchAnalytics();
    }
  }, [user, role, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all cars
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id, make, model, year, stock_id");

      if (carsError) throw carsError;

      // Fetch all vehicle views
      const { data: views, error: viewsError } = await supabase
        .from("vehicle_views")
        .select("car_id, viewed_at")
        .order("viewed_at", { ascending: true });

      if (viewsError) throw viewsError;

      // Process analytics data
      const analyticsMap: { [key: string]: CarAnalytics } = {};
      let total = 0;

      cars?.forEach((car) => {
        analyticsMap[car.id] = {
          car_id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          stock_id: car.stock_id || "",
          total_views: 0,
          views_by_date: [],
        };
      });

      views?.forEach((view) => {
        if (analyticsMap[view.car_id]) {
          analyticsMap[view.car_id].total_views++;
          total++;

          const date = new Date(view.viewed_at).toLocaleDateString();
          const existingDate = analyticsMap[view.car_id].views_by_date.find(
            (v) => v.date === date
          );
          if (existingDate) {
            existingDate.views++;
          } else {
            analyticsMap[view.car_id].views_by_date.push({ date, views: 1 });
          }
        }
      });

      const sortedAnalytics = Object.values(analyticsMap).sort(
        (a, b) => b.total_views - a.total_views
      );

      setAnalytics(sortedAnalytics);
      setTotalViews(total);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const topCars = analytics.slice(0, 10);
  const selectedCar = selectedCarId
    ? analytics.find((a) => a.car_id === selectedCarId)
    : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/admin-dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Vehicle Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Real-time vehicle view tracking and insights
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">
                Across all vehicles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tracked Vehicles
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.length}</div>
              <p className="text-xs text-muted-foreground">
                Total inventory items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Viewed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topCars[0]?.total_views || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {topCars[0]
                  ? `${topCars[0].make} ${topCars[0].model}`
                  : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Most Viewed Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Viewed Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCars}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="stock_id"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card p-3 rounded-lg border">
                          <p className="font-semibold">
                            {data.make} {data.model} ({data.year})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {data.stock_id}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            Views: {data.total_views}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="total_views"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => setSelectedCarId(data.car_id)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Individual Car Timeline (if selected) */}
        {selectedCar && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedCar.make} {selectedCar.model} ({selectedCar.year}) - Views Over Time
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCarId(null)}
                >
                  Clear Selection
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Stock ID: {selectedCar.stock_id} | Total Views: {selectedCar.total_views}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedCar.views_by_date}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleAnalytics;
