import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, AlertTriangle, Lock, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

const SystemSecurityDetails = () => {
  const [loading, setLoading] = useState(true);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityDetails();
  }, []);

  const fetchSecurityDetails = async () => {
    try {
      const [eventsData, failedLoginsData, blockedIPsData] = await Promise.all([
        supabase.from('security_events').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20),
        supabase.from('failed_logins').select('*', { count: 'exact' }),
        supabase.from('blocked_ips').select('*', { count: 'exact' }).eq('active', true)
      ]);

      setSecurityStats({
        totalEvents: eventsData.count || 0,
        failedLogins: failedLoginsData.count || 0,
        blockedIPs: blockedIPsData.count || 0,
        critical: eventsData.data?.filter(e => e.severity === 'critical').length || 0,
        high: eventsData.data?.filter(e => e.severity === 'high').length || 0
      });

      setRecentEvents(eventsData.data || []);
    } catch (error: any) {
      console.error('Error fetching security details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: any = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    };
    return <Badge variant={variants[severity] || 'outline'}>{severity}</Badge>;
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/system-health")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to System Health
      </Button>

      <h1 className="text-3xl font-bold mb-6">Security System Details</h1>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.failedLogins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.blockedIPs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.critical}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
                {getSeverityBadge(event.severity)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSecurityDetails;
