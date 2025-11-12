import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, TrendingUp, Clock, Phone, Mail, MessageSquare, DollarSign } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const VIPAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    contactedOrders: 0,
    closedOrders: 0,
    conversionRate: 0,
    averageResponseTime: 0,
    totalValue: 0,
    contactPreferences: [] as any[],
    popularCars: [] as any[],
    ordersOverTime: [] as any[],
  });
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || role?.role !== "admin") {
      navigate("/auth");
      return;
    }
    fetchAnalytics();
  }, [user, role]);

  const fetchAnalytics = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("whitelist_orders")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Calculate metrics
      const total = orders?.length || 0;
      const pending = orders?.filter(o => o.status === "pending").length || 0;
      const approved = orders?.filter(o => o.status === "approved").length || 0;
      const contacted = orders?.filter(o => o.status === "contacted").length || 0;
      const closed = orders?.filter(o => o.status === "closed").length || 0;
      
      // Conversion rate (approved + contacted + closed / total)
      const conversion = total > 0 ? ((approved + contacted + closed) / total) * 100 : 0;

      // Average response time (for reviewed orders)
      const reviewedOrders = orders?.filter(o => o.reviewed_at) || [];
      let avgResponseTime = 0;
      if (reviewedOrders.length > 0) {
        const totalTime = reviewedOrders.reduce((sum, order) => {
          const submitted = new Date(order.submitted_at).getTime();
          const reviewed = new Date(order.reviewed_at).getTime();
          return sum + (reviewed - submitted);
        }, 0);
        avgResponseTime = (totalTime / reviewedOrders.length) / (1000 * 60 * 60); // Convert to hours
      }

      // Total value
      const totalVal = orders?.reduce((sum, o) => sum + (o.car_price || 0), 0) || 0;

      // Contact preferences
      const contactPref = [
        { name: "WhatsApp", value: orders?.filter(o => o.contact_method === "whatsapp").length || 0 },
        { name: "Call", value: orders?.filter(o => o.contact_method === "call").length || 0 },
        { name: "SMS", value: orders?.filter(o => o.contact_method === "sms").length || 0 },
        { name: "Email", value: orders?.filter(o => o.contact_method === "email").length || 0 },
      ];

      // Popular cars
      const carCounts: { [key: string]: number } = {};
      orders?.forEach(order => {
        const carName = `${order.car_make} ${order.car_model}`;
        carCounts[carName] = (carCounts[carName] || 0) + 1;
      });
      const popular = Object.entries(carCounts)
        .map(([name, count]) => ({ name, orders: count }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // Orders over time (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });
      
      const ordersTime = last7Days.map(date => {
        const count = orders?.filter(o => 
          o.submitted_at.split("T")[0] === date
        ).length || 0;
        return {
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          orders: count
        };
      });

      setAnalytics({
        totalOrders: total,
        pendingOrders: pending,
        approvedOrders: approved,
        contactedOrders: contacted,
        closedOrders: closed,
        conversionRate: conversion,
        averageResponseTime: avgResponseTime,
        totalValue: totalVal,
        contactPreferences: contactPref,
        popularCars: popular,
        ordersOverTime: ordersTime,
      });
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

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">VIP Orders Analytics</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalOrders}</div>
            <p className="text-sm text-muted-foreground">All time VIP orders</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.averageResponseTime.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground">Average review time</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Orders processed</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">KSH {(analytics.totalValue / 1000000).toFixed(1)}M</div>
            <p className="text-sm text-muted-foreground">Total order value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Contact Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.contactPreferences}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.contactPreferences.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Popular Cars */}
      <Card className="glass-strong mb-8">
        <CardHeader>
          <CardTitle>Most Ordered Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.popularCars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }} />
              <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-strong bg-yellow-500/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analytics.pendingOrders}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="glass-strong bg-green-500/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analytics.approvedOrders}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="glass-strong bg-blue-500/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analytics.contactedOrders}</div>
            <p className="text-sm text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card className="glass-strong bg-gray-500/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analytics.closedOrders}</div>
            <p className="text-sm text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VIPAnalytics;
