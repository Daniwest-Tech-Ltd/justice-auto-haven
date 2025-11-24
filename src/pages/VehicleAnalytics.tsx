import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, TrendingUp, Car, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CarAnalytics {
  car_id: string;
  make: string;
  model: string;
  year: number;
  stock_id: string;
  total_views: number;
  views_by_date: { date: string; views: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const VehicleAnalytics = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      setExporting(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your report...",
      });

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`vehicle-analytics-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Success",
        description: "Analytics report exported successfully",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const topCars = analytics.slice(0, 10);
  const selectedCar = selectedCarId
    ? analytics.find((a) => a.car_id === selectedCarId)
    : null;

  // Prepare data for pie chart (views by make)
  const makeDistribution = analytics.reduce((acc, car) => {
    const existing = acc.find(item => item.name === car.make);
    if (existing) {
      existing.value += car.total_views;
    } else {
      acc.push({ name: car.make, value: car.total_views });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value).slice(0, 8);

  // Prepare monthly trends data
  const monthlyTrends = analytics.reduce((acc, car) => {
    car.views_by_date.forEach(view => {
      const existing = acc.find(item => item.date === view.date);
      if (existing) {
        existing.views += view.views;
      } else {
        acc.push({ date: view.date, views: view.views });
      }
    });
    return acc;
  }, [] as { date: string; views: number }[]).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div ref={contentRef} className="max-w-7xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold">Vehicle Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Real-time vehicle view tracking and insights
            </p>
          </div>
          <Button
            onClick={exportToPDF}
            disabled={exporting}
            size="lg"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Generating..." : "Export to PDF"}
          </Button>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Most Viewed Vehicles - 3D Style Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Viewed Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topCars}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
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
                          <div className="bg-card p-3 rounded-lg border shadow-lg">
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
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    onClick={(data) => setSelectedCarId(data.car_id)}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Views Distribution by Make - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Views Distribution by Make</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={makeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {makeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Overall Views Trend - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Views Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
              </AreaChart>
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
