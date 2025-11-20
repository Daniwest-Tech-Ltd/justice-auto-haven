import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Activity, 
  Database, 
  Zap, 
  HardDrive, 
  Clock, 
  AlertTriangle,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";

const SystemHealth = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchHealthData();
    fetchSystemLogs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000);

    // Set up realtime subscription for health updates
    const channel = supabase
      .channel('health-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_health'
        },
        () => {
          fetchHealthData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHealthData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('system-health-check');
      
      if (error) throw error;
      
      setHealthData(data);
    } catch (error: any) {
      console.error('Error fetching health data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system health data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
    await fetchSystemLogs();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      healthy: 'default',
      degraded: 'secondary',
      down: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin-dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-accent bg-clip-text text-transparent">
            System Health Monitor
          </span>
        </h1>
        <p className="text-muted-foreground">
          Real-time monitoring of all system components and services
        </p>
      </div>

      {/* Overall Status */}
      <Card className="glass-strong mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall System Status</span>
            {healthData && getStatusBadge(healthData.overall_status)}
          </CardTitle>
          <CardDescription>
            Last updated: {healthData ? new Date(healthData.last_updated).toLocaleString() : 'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {healthData && getStatusIcon(healthData.overall_status)}
            <div>
              <p className="text-sm text-muted-foreground">
                Check completed in {healthData?.check_duration_ms}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {healthData?.suggestions && healthData.suggestions.length > 0 && (
        <Card className="glass-strong mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              System Recommendations
            </CardTitle>
            <CardDescription>
              Intelligent suggestions based on current system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.suggestions.map((suggestion: string, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    suggestion.includes('🔴') 
                      ? 'bg-destructive/10 border-destructive/50' 
                      : suggestion.includes('⚠️')
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-green-500/10 border-green-500/50'
                  }`}
                >
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Health Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Authentication */}
        <Card className="glass cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/system-auth-details")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-primary" />
              {healthData?.auth && getStatusIcon(healthData.auth.status)}
            </div>
            <CardTitle className="text-lg">Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Users: {healthData?.auth?.total_users || 0}</p>
              <p>Suspended: {healthData?.auth?.suspended_users || 0}</p>
              <p>Latency: {healthData?.auth?.latency_ms || 0}ms</p>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="glass cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/system-database-details")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Database className="h-5 w-5 text-primary" />
              {healthData?.database && getStatusIcon(healthData.database.status)}
            </div>
            <CardTitle className="text-lg">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Cars: {healthData?.database?.cars_count || 0}</p>
              <p>Orders: {healthData?.database?.orders_count || 0}</p>
              <p>Latency: {healthData?.database?.query_latency_ms || 0}ms</p>
            </div>
          </CardContent>
        </Card>

        {/* API */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-primary" />
              {healthData?.api && getStatusIcon(healthData.api.status)}
            </div>
            <CardTitle className="text-lg">API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Calls (24h): {healthData?.api?.api_calls_24h || 0}</p>
              <p>Avg Time: {healthData?.api?.average_response_time_ms || 0}ms</p>
              <p>Error Rate: {healthData?.api?.error_rate || 0}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="glass cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/system-storage-details")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <HardDrive className="h-5 w-5 text-primary" />
              {healthData?.storage && getStatusIcon(healthData.storage.status)}
            </div>
            <CardTitle className="text-lg">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Buckets: {healthData?.storage?.buckets_accessible?.length || 0}</p>
              <p>Latency: {healthData?.storage?.latency_ms || 0}ms</p>
              <p className="text-xs text-muted-foreground">
                {healthData?.storage?.storage_responding ? 'Online' : 'Offline'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cron Jobs */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-primary" />
              {healthData?.cron && getStatusIcon(healthData.cron.status)}
            </div>
            <CardTitle className="text-lg">Cron Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Total Jobs: {healthData?.cron?.total_jobs || 0}</p>
              <p>Failed: {healthData?.cron?.failed_jobs || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-5 w-5 text-primary" />
              {healthData?.logs && getStatusIcon(healthData.logs.status)}
            </div>
            <CardTitle className="text-lg">Logs & Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Errors: {healthData?.logs?.errors_count || 0}</p>
              <p>Warnings: {healthData?.logs?.warnings_count || 0}</p>
              <p>Total: {healthData?.logs?.total_logs || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/system-security-details")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-primary" />
              {healthData?.security && getStatusIcon(healthData.security.status)}
            </div>
            <CardTitle className="text-lg">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Failed Logins: {healthData?.security?.failed_logins_24h || 0}</p>
              <p>Events: {healthData?.security?.security_events_24h || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-primary" />
              {healthData?.uptime && getStatusIcon(healthData.uptime.status)}
            </div>
            <CardTitle className="text-lg">Uptime (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-2xl font-bold">{healthData?.uptime?.uptime_percentage_30d || 100}%</p>
              <p className="text-xs text-muted-foreground">
                {healthData?.uptime?.healthy_checks || 0} / {healthData?.uptime?.total_checks || 0} checks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>System Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs">
            <TabsList>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant={log.severity === 'error' ? 'destructive' : log.severity === 'warning' ? 'secondary' : 'default'}>
                          {log.severity}
                        </Badge>
                        <p className="font-medium mt-1">{log.type}</p>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="metrics">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">Database Latency</p>
                  <p className="text-2xl font-bold">{healthData?.database?.query_latency_ms || 0}ms</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">API Response Time</p>
                  <p className="text-2xl font-bold">{healthData?.api?.average_response_time_ms || 0}ms</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">Storage Latency</p>
                  <p className="text-2xl font-bold">{healthData?.storage?.latency_ms || 0}ms</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">Auth Latency</p>
                  <p className="text-2xl font-bold">{healthData?.auth?.latency_ms || 0}ms</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cron">
              <div className="space-y-2">
                {healthData?.cron?.jobs?.map((job: any) => (
                  <div
                    key={job.job_name}
                    className="p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{job.job_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last run: {job.last_run ? new Date(job.last_run).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </div>
                ))}
                {(!healthData?.cron?.jobs || healthData.cron.jobs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No cron jobs configured</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;