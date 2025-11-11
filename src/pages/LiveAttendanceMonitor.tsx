import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserCheck, UserX, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StaffStatus {
  id: string;
  full_name: string;
  position: string;
  department: string;
  status: "present" | "absent" | "pending";
  clock_in?: string;
  clock_out?: string;
  hours?: number;
}

const LiveAttendanceMonitor = () => {
  const [staffStatuses, setStaffStatuses] = useState<StaffStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, pending: 0 });
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchLiveAttendance();

      // Real-time subscription to attendance changes
      const channel = supabase
        .channel("attendance-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendance",
          },
          () => {
            fetchLiveAttendance();
          }
        )
        .subscribe();

      // Refresh every minute
      const interval = setInterval(fetchLiveAttendance, 60000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user, role]);

  const fetchLiveAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Get all active staff
    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("status", "active");

    if (!staffData) return;

    // Get today's attendance
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("*")
      .eq("date", today);

    // Combine data
    const combined: StaffStatus[] = staffData.map((staff) => {
      const attendance = attendanceData?.find((a) => a.staff_id === staff.id);
      
      let hours = 0;
      if (attendance?.clock_in) {
        const start = new Date(attendance.clock_in);
        const end = attendance.clock_out ? new Date(attendance.clock_out) : new Date();
        let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        
        // Exclude lunch break (13:00-14:00)
        const lunchStart = new Date(start);
        lunchStart.setHours(13, 0, 0, 0);
        const lunchEnd = new Date(start);
        lunchEnd.setHours(14, 0, 0, 0);
        
        if (end > lunchStart && start < lunchEnd) {
          const overlapStart = start < lunchStart ? lunchStart : start;
          const overlapEnd = end > lunchEnd ? lunchEnd : end;
          const lunchMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
          totalMinutes -= lunchMinutes;
        }
        
        hours = totalMinutes / 60;
      }

      return {
        id: staff.id,
        full_name: staff.full_name,
        position: staff.position,
        department: staff.department,
        status: (attendance?.status as "present" | "absent" | "pending") || "pending",
        clock_in: attendance?.clock_in,
        clock_out: attendance?.clock_out,
        hours,
      };
    });

    setStaffStatuses(combined);

    // Calculate stats
    setStats({
      total: combined.length,
      present: combined.filter((s) => s.status === "present").length,
      absent: combined.filter((s) => s.status === "absent").length,
      pending: combined.filter((s) => s.status === "pending").length,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50";
      case "absent":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50";
      default:
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50";
    }
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
              <h1 className="text-4xl font-bold">Live Attendance Monitor</h1>
              <p className="text-muted-foreground">Real-time staff attendance tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-red-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-yellow-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Clocked In</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffStatuses.map((staff) => (
            <Card key={staff.id} className="glass-strong">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{staff.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{staff.position}</p>
                    <p className="text-xs text-muted-foreground">{staff.department}</p>
                  </div>
                  <Badge className={getStatusColor(staff.status)}>
                    {staff.status}
                  </Badge>
                </div>

                {staff.clock_in && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clock In:</span>
                      <span className="font-medium">
                        {new Date(staff.clock_in).toLocaleTimeString()}
                      </span>
                    </div>
                    {staff.clock_out && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clock Out:</span>
                        <span className="font-medium">
                          {new Date(staff.clock_out).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Hours:</span>
                      <span className="font-bold">
                        {staff.hours?.toFixed(2)} hrs
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveAttendanceMonitor;
