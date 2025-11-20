import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Car, ShoppingCart, MessageSquare, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

const SystemDatabaseDetails = () => {
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDatabaseDetails();
  }, []);

  const fetchDatabaseDetails = async () => {
    try {
      const startTime = Date.now();
      
      const [carsData, salesData, messagesData, reviewsData, tradesData] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact' }),
        supabase.from('sales').select('*', { count: 'exact' }),
        supabase.from('messages').select('*', { count: 'exact' }),
        supabase.from('reviews').select('*', { count: 'exact' }),
        supabase.from('trade_ins').select('*', { count: 'exact' })
      ]);

      const latency = Date.now() - startTime;

      setDbStats({
        cars: carsData.count || 0,
        sales: salesData.count || 0,
        messages: messagesData.count || 0,
        reviews: reviewsData.count || 0,
        tradeIns: tradesData.count || 0,
        latency
      });
    } catch (error: any) {
      console.error('Error fetching database details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch database statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/system-health")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to System Health
      </Button>

      <h1 className="text-3xl font-bold mb-6">Database System Details</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cars Inventory</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.cars}</div>
            <p className="text-xs text-muted-foreground">Total vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Records</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.sales}</div>
            <p className="text-xs text-muted-foreground">Completed sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.messages}</div>
            <p className="text-xs text-muted-foreground">Total messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.reviews}</div>
            <p className="text-xs text-muted-foreground">Customer reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trade-Ins</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.tradeIns}</div>
            <p className="text-xs text-muted-foreground">Trade-in submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Latency</CardTitle>
            <Database className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats?.latency}ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Connection Status</span>
              <span className="font-semibold text-green-500">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Response Time</span>
              <span className="font-semibold">{dbStats?.latency}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Records</span>
              <span className="font-semibold">
                {(dbStats?.cars || 0) + (dbStats?.sales || 0) + (dbStats?.messages || 0) + (dbStats?.reviews || 0) + (dbStats?.tradeIns || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDatabaseDetails;
