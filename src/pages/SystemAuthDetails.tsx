import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserCheck, UserX, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

const SystemAuthDetails = () => {
  const [loading, setLoading] = useState(true);
  const [authStats, setAuthStats] = useState<any>(null);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAuthDetails();
  }, []);

  const fetchAuthDetails = async () => {
    try {
      const [profilesData, sessionsData, failedLoginsData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('failed_logins').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      const suspended = profilesData.data?.filter(p => p.is_suspended).length || 0;
      const online = profilesData.data?.filter(p => p.is_online).length || 0;

      setAuthStats({
        totalUsers: profilesData.count || 0,
        suspended,
        online,
        failedLogins: failedLoginsData.data?.length || 0
      });

      setRecentLogins(sessionsData.data || []);
    } catch (error: any) {
      console.error('Error fetching auth details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch authentication data",
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

      <h1 className="text-3xl font-bold mb-6">Authentication System Details</h1>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authStats?.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authStats?.online}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authStats?.suspended}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authStats?.failedLogins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLogins.map((session) => (
              <div key={session.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">User ID: {session.user_id.substring(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground">
                    Login: {new Date(session.login_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={session.logout_at ? "secondary" : "default"}>
                  {session.logout_at ? "Logged Out" : "Active"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAuthDetails;
