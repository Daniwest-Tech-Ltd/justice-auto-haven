import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, TrendingUp, Users, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  details: any;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

const ActivityAnalytics = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    activeUsers: 0,
    todayActivities: 0,
  });
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchActivities();
      fetchStats();
    }
  }, [user, role, startDate, endDate]);

  const fetchActivities = async () => {
    try {
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", startDateTime)
        .lte("created_at", endDateTime)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch user names separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        const enrichedData = data.map(activity => ({
          ...activity,
          profiles: profiles?.find(p => p.user_id === activity.user_id)
        }));
        
        setActivities(enrichedData as any);
      } else {
        setActivities([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Total activities
      const { count: totalCount } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true });

      // Today's activities
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      // Active users (unique users with activity today)
      const { data: activeUsersData } = await supabase
        .from("activity_logs")
        .select("user_id")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      const uniqueUsers = new Set(activeUsersData?.map(a => a.user_id)).size;

      setStats({
        totalActivities: totalCount || 0,
        activeUsers: uniqueUsers,
        todayActivities: todayCount || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "default";
    if (action.includes("update") || action.includes("edit")) return "secondary";
    if (action.includes("delete")) return "destructive";
    return "outline";
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Activity Analytics</h1>
              <p className="text-muted-foreground">Track system usage and staff activities</p>
            </div>
          </div>
          <Activity className="h-8 w-8 text-primary" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActivities}</div>
              <p className="text-xs text-muted-foreground">All time activities</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Staff members active</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayActivities}</div>
              <p className="text-xs text-muted-foreground">Actions performed today</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Date Range Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Activity Log ({activities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No activities found for this date range
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <p className="font-medium">{activity.profiles?.full_name || "Unknown"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(activity.action_type)}>
                          {activity.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.target_table ? (
                          <div className="text-sm">
                            <p className="font-medium">{activity.target_table}</p>
                            {activity.target_id && (
                              <p className="text-xs text-muted-foreground">ID: {activity.target_id.substring(0, 8)}...</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(activity.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {activity.details && Object.keys(activity.details).length > 0 ? (
                          <pre className="text-xs bg-secondary/20 p-2 rounded max-w-xs overflow-auto">
                            {JSON.stringify(activity.details, null, 2).substring(0, 100)}...
                          </pre>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityAnalytics;
