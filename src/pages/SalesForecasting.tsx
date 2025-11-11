import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface SalesData {
  month: string;
  sales: number;
  revenue: number;
}

const SalesForecasting = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [forecast, setForecast] = useState<SalesData[]>([]);
  const [stats, setStats] = useState({
    avgMonthlySales: 0,
    avgMonthlyRevenue: 0,
    growthRate: 0,
    nextMonthForecast: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchSalesData();
    }
  }, [user, role]);

  const fetchSalesData = async () => {
    try {
      // Fetch sales data for the last 12 months
      const { data: sales, error } = await supabase
        .from("sales")
        .select("sale_date, sale_price")
        .order("sale_date", { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { sales: number; revenue: number } } = {};
      
      sales?.forEach((sale) => {
        const date = new Date(sale.sale_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { sales: 0, revenue: 0 };
        }
        
        monthlyData[monthKey].sales += 1;
        monthlyData[monthKey].revenue += Number(sale.sale_price);
      });

      // Convert to array and format
      const formattedData: SalesData[] = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sales: data.sales,
          revenue: data.revenue,
        }))
        .slice(-6); // Last 6 months

      setSalesData(formattedData);

      // Calculate simple forecast (linear regression)
      if (formattedData.length > 0) {
        const avgSales = formattedData.reduce((sum, d) => sum + d.sales, 0) / formattedData.length;
        const avgRevenue = formattedData.reduce((sum, d) => sum + d.revenue, 0) / formattedData.length;
        
        // Calculate growth rate (last 3 months vs previous 3 months)
        const recent = formattedData.slice(-3);
        const previous = formattedData.slice(-6, -3);
        
        const recentAvg = recent.reduce((sum, d) => sum + d.revenue, 0) / recent.length;
        const previousAvg = previous.reduce((sum, d) => sum + d.revenue, 0) / previous.length;
        const growthRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

        // Generate forecast for next 3 months
        const lastMonth = formattedData[formattedData.length - 1];
        const forecastData: SalesData[] = [];
        
        for (let i = 1; i <= 3; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() + i);
          forecastData.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            sales: Math.round(avgSales * (1 + growthRate / 100)),
            revenue: Math.round(avgRevenue * (1 + growthRate / 100)),
          });
        }

        setForecast(forecastData);
        setStats({
          avgMonthlySales: Math.round(avgSales),
          avgMonthlyRevenue: Math.round(avgRevenue),
          growthRate: Math.round(growthRate * 10) / 10,
          nextMonthForecast: forecastData[0]?.revenue || 0,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const combinedData = [...salesData, ...forecast.map(f => ({ ...f, isForecast: true }))];

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Sales Forecasting</h1>
              <p className="text-muted-foreground">AI-powered sales predictions and analytics</p>
            </div>
          </div>
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Sales</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgMonthlySales}</div>
              <p className="text-xs text-muted-foreground">vehicles per month</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {stats.avgMonthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">average revenue</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
              </div>
              <p className="text-xs text-muted-foreground">month-over-month</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Month Forecast</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {stats.nextMonthForecast.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">predicted revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Sales Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Vehicles Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Revenue (KSh)"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Forecast Table */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>3-Month Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecast.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.month}</p>
                    <p className="text-sm text-muted-foreground">Predicted Period</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">KSh {item.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{item.sales} vehicles</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesForecasting;