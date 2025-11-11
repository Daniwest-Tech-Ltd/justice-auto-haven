import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, TrendingUp, Users, Clock, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  details: any;
  created_at: string;
}

interface StaffActivity {
  userId: string;
  fullName: string;
  email: string;
  activities: ActivityLog[];
  totalActions: number;
}

const ActivityAnalytics = () => {
  const [staffActivities, setStaffActivities] = useState<StaffActivity[]>([]);
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

      const { data: activities, error } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", startDateTime)
        .lte("created_at", endDateTime)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group activities by user
      if (activities && activities.length > 0) {
        const userIds = [...new Set(activities.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        const staffMap = new Map<string, StaffActivity>();

        activities.forEach(activity => {
          const profile = profiles?.find(p => p.user_id === activity.user_id);
          const userId = activity.user_id;

          if (!staffMap.has(userId)) {
            staffMap.set(userId, {
              userId,
              fullName: profile?.full_name || "Unknown",
              email: profile?.email || "N/A",
              activities: [],
              totalActions: 0,
            });
          }

          const staff = staffMap.get(userId)!;
          staff.activities.push(activity);
          staff.totalActions++;
        });

        setStaffActivities(Array.from(staffMap.values()));
      } else {
        setStaffActivities([]);
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
      const { count: totalCount } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

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

  const exportStaffPDF = async (staff: StaffActivity) => {
    const doc = new jsPDF();
    
    // Add watermark
    doc.setFontSize(60);
    doc.setTextColor(220, 220, 220);
    doc.text("ULTIMATE", 105, 150, { align: "center", angle: 45 });

    // Reset color for content
    doc.setTextColor(0, 0, 0);

    // Header
    doc.setFontSize(20);
    doc.text("Justice Ultimate Automobiles", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.text("Staff Activity Report", 105, 30, { align: "center" });

    // Staff Details
    doc.setFontSize(12);
    doc.text(`Staff Name: ${staff.fullName}`, 20, 50);
    doc.text(`Email: ${staff.email}`, 20, 60);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 20, 70);
    doc.text(`Total Actions: ${staff.totalActions}`, 20, 80);

    // Activities
    doc.setFontSize(14);
    doc.text("Activities:", 20, 95);

    doc.setFontSize(10);
    let yPosition = 105;
    const pageHeight = doc.internal.pageSize.height;

    staff.activities.slice(0, 20).forEach((activity, idx) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
        
        // Add watermark to new page
        doc.setFontSize(60);
        doc.setTextColor(220, 220, 220);
        doc.text("ULTIMATE", 105, 150, { align: "center", angle: 45 });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }

      const date = new Date(activity.created_at).toLocaleString();
      const action = activity.action_type;
      const target = activity.target_table || "N/A";
      
      doc.text(`${idx + 1}. ${action} - ${target} (${date})`, 20, yPosition);
      yPosition += 7;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
        105,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(`${staff.fullName}_activity_${startDate}_${endDate}.pdf`);
    
    toast({
      title: "Success",
      description: "PDF exported successfully",
    });
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

        {/* Staff Activity Tiles */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Staff Activity Details</h2>
          {staffActivities.length === 0 ? (
            <Card className="glass-strong">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No activities found for this date range</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffActivities.map((staff) => (
                <Card key={staff.userId} className="glass-strong hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{staff.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{staff.email}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Actions:</span>
                      <Badge variant="secondary">{staff.totalActions}</Badge>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {staff.activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="text-xs p-2 bg-secondary/20 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[10px]">
                              {activity.action_type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {activity.target_table && (
                            <p className="text-[10px] text-muted-foreground">
                              Target: {activity.target_table}
                            </p>
                          )}
                        </div>
                      ))}
                      {staff.activities.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{staff.activities.length - 5} more activities
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => exportStaffPDF(staff)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityAnalytics;
