import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Calendar, DollarSign, TrendingUp, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const HRManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    pendingPayroll: 0,
    totalSalary: 0,
  });
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchStaff();
      fetchStats();
    }
  }, [user, role]);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStaff(data);
    }
  };

  const fetchStats = async () => {
    const { data: staffData } = await supabase.from("staff").select("*");
    const { data: payrollData } = await supabase.from("payroll").select("*").eq("payment_status", "pending");

    if (staffData) {
      const active = staffData.filter(s => s.status === "active").length;
      const totalSalary = staffData.reduce((sum, s) => sum + (typeof s.salary === 'string' ? parseFloat(s.salary) : s.salary), 0);

      setStats({
        totalStaff: staffData.length,
        activeStaff: active,
        pendingPayroll: payrollData?.length || 0,
        totalSalary,
      });
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Human Resource Management</h1>
              <p className="text-muted-foreground">Manage staff, payroll, and attendance</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/hr/add-staff")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">{stats.activeStaff} active</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeStaff}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingPayroll}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">KES {stats.totalSalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Monthly expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono">{member.staff_id}</TableCell>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell className="capitalize">{member.position.replace('_', ' ')}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>KES {parseFloat(member.salary).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/hr/staff-badge/${member.id}`)}
                      >
                        View Badge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRManagement;