import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

interface AnalyticsData {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  closedOrders: number;
  avgResponseTime: string;
  conversionRate: number;
}

export const OrderAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    closedOrders: 0,
    avgResponseTime: "0h",
    conversionRate: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: orders } = await supabase
      .from("whitelist_orders")
      .select("*");

    if (!orders) return;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const approvedOrders = orders.filter(o => o.status === "approved").length;
    const closedOrders = orders.filter(o => o.status === "closed").length;

    // Calculate average response time
    const reviewedOrders = orders.filter(o => o.reviewed_at);
    let avgResponseMs = 0;
    if (reviewedOrders.length > 0) {
      avgResponseMs = reviewedOrders.reduce((acc, order) => {
        const submitted = new Date(order.submitted_at).getTime();
        const reviewed = new Date(order.reviewed_at!).getTime();
        return acc + (reviewed - submitted);
      }, 0) / reviewedOrders.length;
    }
    const avgResponseHours = Math.round(avgResponseMs / (1000 * 60 * 60));

    // Calculate conversion rate
    const conversionRate = totalOrders > 0 
      ? Math.round((closedOrders / totalOrders) * 100) 
      : 0;

    setAnalytics({
      totalOrders,
      pendingOrders,
      approvedOrders,
      closedOrders,
      avgResponseTime: `${avgResponseHours}h`,
      conversionRate
    });
  };

  const stats = [
    {
      title: "Total Orders",
      value: analytics.totalOrders,
      icon: TrendingUp,
      color: "text-primary"
    },
    {
      title: "Pending",
      value: analytics.pendingOrders,
      icon: Clock,
      color: "text-yellow-500"
    },
    {
      title: "Approved",
      value: analytics.approvedOrders,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Closed",
      value: analytics.closedOrders,
      icon: XCircle,
      color: "text-red-500"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Time from submission to first review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Orders closed successfully
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
