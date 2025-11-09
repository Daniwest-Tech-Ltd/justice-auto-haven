import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, DollarSign, Car, Users } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalCars: 0,
    soldCars: 0,
  });
  const [salesByMonth, setSalesByMonth] = useState<any[]>([]);
  const [salesByBrand, setSalesByBrand] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*, cars(make, model)");

      if (salesError) throw salesError;

      // Fetch all cars
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*");

      if (carsError) throw carsError;

      // Calculate stats
      const totalSales = salesData?.length || 0;
      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0;
      const soldCars = carsData?.filter(car => car.status === "sold").length || 0;
      const totalCars = carsData?.length || 0;

      setStats({
        totalSales,
        totalRevenue,
        totalCars,
        soldCars,
      });

      // Sales by month
      const monthlySales = salesData?.reduce((acc: any, sale) => {
        const month = new Date(sale.sale_date).toLocaleString('default', { month: 'short' });
        const existing = acc.find((item: any) => item.month === month);
        if (existing) {
          existing.sales += 1;
          existing.revenue += Number(sale.sale_price);
        } else {
          acc.push({ month, sales: 1, revenue: Number(sale.sale_price) });
        }
        return acc;
      }, []) || [];

      setSalesByMonth(monthlySales);

      // Sales by brand
      const brandSales = salesData?.reduce((acc: any, sale: any) => {
        const brand = sale.cars?.make || "Unknown";
        const existing = acc.find((item: any) => item.brand === brand);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ brand, count: 1 });
        }
        return acc;
      }, []) || [];

      setSalesByBrand(brandSales);

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

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin-dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-4xl font-bold mb-8">Sales Analytics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <h3 className="text-3xl font-bold">{stats.totalSales}</h3>
              </div>
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">
                  KSh {stats.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <DollarSign className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cars Sold</p>
                <h3 className="text-3xl font-bold">{stats.soldCars}</h3>
              </div>
              <Car className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory</p>
                <h3 className="text-3xl font-bold">{stats.totalCars}</h3>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Sales by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByBrand}
                  dataKey="count"
                  nameKey="brand"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {salesByBrand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (KSh)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesAnalytics;