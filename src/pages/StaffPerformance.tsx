import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Users, Clock, Calendar, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

interface StaffMember {
  id: string;
  full_name: string;
  position: string;
  department: string;
}

interface PerformanceData {
  staff_id: string;
  full_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  total_hours: number;
  avg_hours_per_day: number;
  total_activities: number;
}

const StaffPerformance = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchStaff();
      fetchPerformanceData();
    }
  }, [user, role, selectedMonth, selectedYear, selectedDepartment]);

  const fetchStaff = async () => {
    try {
      const query = supabase.from("staff").select("*").eq("status", "active");
      
      if (selectedDepartment !== "all") {
        query.eq("department", selectedDepartment);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, full_name, position, department")
        .eq("status", "active");

      if (!staffData) return;

      const performanceResults: PerformanceData[] = [];

      for (const member of staffData) {
        if (selectedDepartment !== "all" && member.department !== selectedDepartment) {
          continue;
        }

        // Get attendance data
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("staff_id", member.id)
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0]);

        const totalDays = attendanceData?.length || 0;
        const presentDays = attendanceData?.filter(a => a.status === "present").length || 0;
        const absentDays = totalDays - presentDays;

        // Calculate total hours (excluding 1hr lunch)
        let totalHours = 0;
        attendanceData?.forEach(record => {
          if (record.clock_in && record.clock_out) {
            const start = new Date(record.clock_in);
            const end = new Date(record.clock_out);
            let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            // Subtract lunch hour if work period includes 13:00-14:00
            if (hours > 5) hours -= 1; // Rough estimate
            totalHours += hours;
          }
        });

        // Get activity count
        const { count: activityCount } = await supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", member.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());

        performanceResults.push({
          staff_id: member.id,
          full_name: member.full_name,
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          total_hours: totalHours,
          avg_hours_per_day: totalDays > 0 ? totalHours / presentDays : 0,
          total_activities: activityCount || 0,
        });
      }

      setPerformanceData(performanceResults);
    } catch (error: any) {
      console.error("Error fetching performance data:", error);
    }
  };

  const attendanceChartData = performanceData.map(p => ({
    name: p.full_name.split(' ')[0],
    present: p.present_days,
    absent: p.absent_days,
  }));

  const hoursChartData = performanceData.map(p => ({
    name: p.full_name.split(' ')[0],
    hours: parseFloat(p.total_hours.toFixed(1)),
    avgHours: parseFloat(p.avg_hours_per_day.toFixed(1)),
  }));

  const activityChartData = performanceData.map(p => ({
    name: p.full_name.split(' ')[0],
    activities: p.total_activities,
  }));

  const departmentStats = performanceData.reduce((acc: any, curr) => {
    const dept = staff.find(s => s.id === curr.staff_id)?.department || "Unknown";
    if (!acc[dept]) {
      acc[dept] = { name: dept, value: 0 };
    }
    acc[dept].value += curr.total_hours;
    return acc;
  }, {});

  const pieData = Object.values(departmentStats);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const totalStats = performanceData.reduce((acc, curr) => ({
    totalHours: acc.totalHours + curr.total_hours,
    totalActivities: acc.totalActivities + curr.total_activities,
    avgAttendance: acc.avgAttendance + (curr.total_days > 0 ? (curr.present_days / curr.total_days) * 100 : 0),
  }), { totalHours: 0, totalActivities: 0, avgAttendance: 0 });

  totalStats.avgAttendance = performanceData.length > 0 ? totalStats.avgAttendance / performanceData.length : 0;

  const exportToExcel = () => {
    const exportData = performanceData.map(p => ({
      Name: p.full_name,
      "Total Days": p.total_days,
      "Present Days": p.present_days,
      "Absent Days": p.absent_days,
      "Total Hours": p.total_hours.toFixed(2),
      "Avg Hours/Day": p.avg_hours_per_day.toFixed(2),
      "Total Activities": p.total_activities,
      "Attendance Rate": p.total_days > 0 ? ((p.present_days / p.total_days) * 100).toFixed(1) + "%" : "0%",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance");
    XLSX.writeFile(workbook, `staff_performance_${selectedMonth}_${selectedYear}.xlsx`);

    toast({
      title: "Export Successful",
      description: "Performance data exported to Excel.",
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
              <h1 className="text-4xl font-bold">Staff Performance Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive analytics and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalHours.toFixed(1)} hrs</div>
              <p className="text-xs text-muted-foreground">Across all staff</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalActivities}</div>
              <p className="text-xs text-muted-foreground">System actions performed</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.avgAttendance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Presence rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Chart */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#22c55e" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hours Worked Chart */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Hours Worked</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hoursChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" name="Total Hours" />
                  <Line type="monotone" dataKey="avgHours" stroke="#82ca9d" name="Avg Hours/Day" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Chart */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Activities Performed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activities" fill="#a855f7" name="Activities" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Hours by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformance;
