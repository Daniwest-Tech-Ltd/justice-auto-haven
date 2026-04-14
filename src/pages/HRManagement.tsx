import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Calendar, DollarSign, TrendingUp, ArrowLeft, Search, Shield, Clock, FileText, Edit, CheckCircle, XCircle, FolderOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserWithRole {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url: string | null;
}

const STAFF_ROLES = [
  { value: "hr_manager", label: "HR Manager" },
  { value: "hr_staff", label: "HR Staff" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "sales_rep", label: "Sales Representative" },
  { value: "marketing_manager", label: "Marketing Manager" },
  { value: "marketing_staff", label: "Marketing Staff" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "rental_manager", label: "Rental Manager" },
  { value: "mechanic", label: "Mechanic" },
  { value: "accounts_manager", label: "Accounts Manager" },
  { value: "finance_staff", label: "Finance Staff" },
  { value: "driver", label: "Driver" },
  { value: "security_officer", label: "Security Officer" },
  { value: "it_support", label: "IT Support" },
  { value: "system_admin", label: "System Admin" },
];

const HRManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [stats, setStats] = useState({ totalStaff: 0, activeStaff: 0, pendingPayroll: 0, totalSalary: 0, pendingReceipts: 0 });
  const [roleDialog, setRoleDialog] = useState(false);
  const [salaryDialog, setSalaryDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>(null);
  const [assignRole, setAssignRole] = useState("");
  const [assignDept, setAssignDept] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");
  const [activeTab, setActiveTab] = useState("staff");
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchStaff();
      fetchStats();
      fetchAllUsers();
      fetchPendingReceipts();
    }
  }, [user, role]);

  const fetchAllUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, avatar_url");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (profiles && roles) {
      const roleMap: Record<string, string> = {};
      roles.forEach((r: any) => { roleMap[r.user_id] = r.role; });
      setAllUsers(profiles.map((p: any) => ({ ...p, role: roleMap[p.user_id] || "customer" })));
    }
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    if (!error && data) setStaff(data);
  };

  const fetchPendingReceipts = async () => {
    const { data } = await supabase.from("sales_receipts").select("*").order("created_at", { ascending: false });
    if (data) setPendingReceipts(data);
  };

  const fetchStats = async () => {
    const { data: staffData } = await supabase.from("staff").select("*");
    const { data: payrollData } = await supabase.from("payroll").select("*").eq("payment_status", "pending");
    const { data: receiptData } = await supabase.from("sales_receipts").select("id").eq("status", "pending");
    if (staffData && payrollData) {
      setStats({
        totalStaff: staffData.length,
        activeStaff: staffData.filter((s: any) => s.status === "active").length,
        pendingPayroll: payrollData.length,
        totalSalary: payrollData.reduce((sum: number, p: any) => sum + (p.basic_salary || 0), 0),
        pendingReceipts: receiptData?.length || 0,
      });
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !assignRole) return;
    try {
      // Update user_roles to staff
      await supabase.from("user_roles").upsert(
        { user_id: selectedUser.user_id, role: "staff" },
        { onConflict: "user_id,role", ignoreDuplicates: false }
      );

      // Remove customer role if exists
      await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id).eq("role", "customer");

      // Create or update staff record
      const nameParts = selectedUser.full_name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { data: existingStaff } = await supabase.from("staff").select("id").eq("user_id", selectedUser.user_id).maybeSingle();
      const dept = assignDept || getDepartmentFromRole(assignRole);

      if (existingStaff) {
        await supabase.from("staff").update({
          role: assignRole as any,
          department: dept,
          status: "active",
        }).eq("id", existingStaff.id);
      } else {
        await supabase.from("staff").insert([{
          user_id: selectedUser.user_id,
          username: selectedUser.email.split("@")[0],
          email: selectedUser.email,
          first_name: firstName,
          last_name: lastName,
          phone: selectedUser.phone || "",
          role: assignRole as any,
          department: dept,
          status: "active",
        }]);
      }

      toast({ title: "Role Assigned", description: `${selectedUser.full_name} assigned as ${assignRole.replace(/_/g, " ")}` });
      setRoleDialog(false);
      setSelectedUser(null);
      setAssignRole("");
      setAssignDept("");
      fetchStaff();
      fetchAllUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveSalary = async () => {
    if (!selectedStaffMember || !salaryAmount) return;
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const basicSalary = parseFloat(salaryAmount);
      const allowAmt = parseFloat(allowances) || 0;
      const deductAmt = parseFloat(deductions) || 0;
      const netPay = basicSalary + allowAmt - deductAmt;

      const { data: existing } = await supabase.from("payroll").select("id")
        .eq("staff_id", selectedStaffMember.id)
        .eq("pay_period_start", periodStart)
        .maybeSingle();

      if (existing) {
        await supabase.from("payroll").update({
          basic_salary: basicSalary, allowances: allowAmt, deductions: deductAmt, net_pay: netPay,
        }).eq("id", existing.id);
      } else {
        await supabase.from("payroll").insert({
          staff_id: selectedStaffMember.id, pay_period_start: periodStart, pay_period_end: periodEnd,
          basic_salary: basicSalary, allowances: allowAmt, deductions: deductAmt, net_pay: netPay,
          payment_status: "pending",
        });
      }

      toast({ title: "Salary Updated", description: `Salary set for ${selectedStaffMember.first_name} ${selectedStaffMember.last_name}` });
      setSalaryDialog(false);
      setSelectedStaffMember(null);
      setSalaryAmount("");
      setAllowances("");
      setDeductions("");
      fetchStats();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getDepartmentFromRole = (role: string): string => {
    if (role.includes("hr")) return "Human Resources";
    if (role.includes("sales")) return "Sales";
    if (role.includes("marketing")) return "Marketing";
    if (role.includes("rental")) return "Rentals";
    if (role.includes("mechanic")) return "Workshop";
    if (role.includes("accounts") || role.includes("finance")) return "Finance";
    if (role.includes("driver")) return "Logistics";
    if (role.includes("security")) return "Security";
    if (role.includes("it") || role.includes("system")) return "IT";
    return "Operations";
  };

  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const filteredStaff = staff.filter((s) => {
    const q = staffSearch.toLowerCase();
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(q) || s.email?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold">Human Resource Management</h1>
              <p className="text-muted-foreground">Manage staff, payroll, attendance & roles</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/admin/hr/documents")}><FolderOpen className="mr-2 h-4 w-4" />Documents</Button>
            <Button variant="outline" onClick={() => navigate("/admin/hr/attendance")}><Clock className="mr-2 h-4 w-4" />Attendance</Button>
            <Button variant="outline" onClick={() => navigate("/admin/hr/payroll")}><DollarSign className="mr-2 h-4 w-4" />Payroll</Button>
            <Button variant="outline" onClick={() => navigate("/admin/sales-management")}><FileText className="mr-2 h-4 w-4" />Sales</Button>
            <Button onClick={() => navigate("/admin/hr/add-staff")}><UserPlus className="mr-2 h-4 w-4" />Add Staff</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Staff</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalStaff}</div><p className="text-xs text-muted-foreground">{stats.activeStaff} active</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Staff</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeStaff}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Payroll</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingPayroll}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Receipts</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-500">{stats.pendingReceipts}</div></CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="staff">Staff Members</TabsTrigger>
            <TabsTrigger value="users">All Users / Assign Roles</TabsTrigger>
            <TabsTrigger value="attendance">Today's Attendance</TabsTrigger>
          </TabsList>

          {/* Staff Members Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle>Staff Members</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search staff..." className="pl-9" value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{member.role?.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell>{member.department}</TableCell>
                          <TableCell><Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedStaffMember(member); setSalaryDialog(true); }}>
                                <DollarSign className="h-3 w-3 mr-1" />Salary
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/admin/hr/staff-badge/${member.id}`)}>Badge</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStaff.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No staff found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <CardTitle>All System Users ({allUsers.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge variant={u.role === "admin" ? "default" : u.role === "staff" ? "secondary" : "outline"} className="capitalize">{u.role}</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setRoleDialog(true); }}>
                              <Shield className="h-3 w-3 mr-1" />Assign Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Today's Attendance Tab */}
          <TabsContent value="attendance">
            <AttendanceOverview />
          </TabsContent>
        </Tabs>

        {/* Role Assignment Dialog */}
        <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Staff Role to {selectedUser?.full_name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Staff Role</Label>
                <Select value={assignRole} onValueChange={setAssignRole}>
                  <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department (auto-filled)</Label>
                <Input value={assignDept || (assignRole ? getDepartmentFromRole(assignRole) : "")} onChange={(e) => setAssignDept(e.target.value)} />
              </div>
            </div>
            <DialogFooter><Button onClick={handleAssignRole} disabled={!assignRole}>Assign Role</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Salary Dialog */}
        <Dialog open={salaryDialog} onOpenChange={setSalaryDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Manage Salary - {selectedStaffMember?.first_name} {selectedStaffMember?.last_name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Basic Salary (KES)</Label><Input type="number" placeholder="e.g. 50000" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} /></div>
              <div><Label>Allowances (KES)</Label><Input type="number" placeholder="e.g. 5000" value={allowances} onChange={(e) => setAllowances(e.target.value)} /></div>
              <div><Label>Deductions (KES)</Label><Input type="number" placeholder="e.g. 3000" value={deductions} onChange={(e) => setDeductions(e.target.value)} /></div>
              {salaryAmount && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">Net Pay: KES {((parseFloat(salaryAmount) || 0) + (parseFloat(allowances) || 0) - (parseFloat(deductions) || 0)).toLocaleString()}</p>
                </div>
              )}
            </div>
            <DialogFooter><Button onClick={handleSaveSalary} disabled={!salaryAmount}>Save Salary</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Attendance overview component
const AttendanceOverview = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { fetchTodayAttendance(); }, []);

  const fetchTodayAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*, staff:staff_id(first_name, last_name, role, department)")
      .eq("date", today)
      .order("clock_in", { ascending: true });
    if (data) setAttendance(data);
  };

  const formatTime = (t: string | null) => t ? new Date(t).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <Card>
      <CardHeader><CardTitle>Today's Attendance — {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.staff?.first_name} {a.staff?.last_name}</TableCell>
                  <TableCell>{a.staff?.department}</TableCell>
                  <TableCell className="text-primary font-mono">{formatTime(a.clock_in)}</TableCell>
                  <TableCell className="text-destructive font-mono">{formatTime(a.clock_out)}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No attendance records for today</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HRManagement;
