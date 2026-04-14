import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, DollarSign, LogOut, RefreshCw, Search, CheckCircle, XCircle, FileText, FolderOpen, Calendar, TrendingUp, LogIn, LogOutIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import DashboardHolidayBanner, { DashboardSnowfall } from "@/components/DashboardHolidayBanner";

export default function HRDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [stats, setStats] = useState({ totalStaff: 0, activeStaff: 0, pendingPayroll: 0, pendingReceipts: 0 });

  useEffect(() => {
    if (user) {
      fetchAll();
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const fetchAll = async () => {
    // Fetch staff profile for attendance
    const { data: sp } = await supabase.from("staff").select("*").eq("user_id", user?.id).maybeSingle();
    setStaffProfile(sp);

    if (sp) {
      const today = new Date().toISOString().split("T")[0];
      const { data: ta } = await supabase.from("attendance").select("*").eq("staff_id", sp.id).eq("date", today).maybeSingle();
      setTodayAttendance(ta);
    }

    // Fetch all staff
    const { data: staffData } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    if (staffData) setStaff(staffData);

    // Fetch pending receipts
    const { data: receipts } = await supabase.from("sales_receipts").select("*").order("created_at", { ascending: false });
    if (receipts) setPendingReceipts(receipts);

    // Fetch today's attendance
    const today = new Date().toISOString().split("T")[0];
    const { data: attData } = await supabase.from("attendance").select("*").eq("date", today);
    if (attData) setAttendance(attData);

    // Fetch payroll
    const { data: payrollData } = await supabase.from("payroll").select("*").eq("payment_status", "pending");
    if (payrollData) setPayroll(payrollData);

    // Stats
    setStats({
      totalStaff: staffData?.length || 0,
      activeStaff: staffData?.filter((s: any) => s.status === "active").length || 0,
      pendingPayroll: payrollData?.length || 0,
      pendingReceipts: receipts?.filter((r: any) => r.status === "pending").length || 0,
    });
  };

  const handleClockIn = async () => {
    if (!staffProfile) return;
    setClockingIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();
      if (todayAttendance) {
        await supabase.from("attendance").update({ clock_in: now, status: "present" }).eq("id", todayAttendance.id);
      } else {
        await supabase.from("attendance").insert([{ staff_id: staffProfile.id, date: today, clock_in: now, status: "present" }]);
      }

      // Send clock-in email notification
      supabase.functions.invoke("send-notifications", {
        body: {
          type: "clock_in",
          staffName: `${staffProfile.first_name} ${staffProfile.last_name}`,
          staffEmail: staffProfile.email,
          time: new Date().toLocaleTimeString("en-KE"),
          date: new Date().toLocaleDateString("en-KE"),
        },
      }).catch(() => {});

      sonnerToast.success("Clocked in successfully! ✅");
      fetchAll();
    } catch (err: any) {
      sonnerToast.error("Failed to clock in: " + err.message);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayAttendance) return;
    setClockingIn(true);
    try {
      await supabase.from("attendance").update({ clock_out: new Date().toISOString() }).eq("id", todayAttendance.id);
      sonnerToast.success("Clocked out successfully! 👋");
      fetchAll();
    } catch (err: any) {
      sonnerToast.error("Failed to clock out: " + err.message);
    } finally {
      setClockingIn(false);
    }
  };

  const handleApproveReceipt = async (receiptId: string) => {
    await supabase.from("sales_receipts").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user?.id }).eq("id", receiptId);
    toast({ title: "Receipt Approved" });
    fetchAll();
  };

  const handleRejectReceipt = async (receiptId: string) => {
    await supabase.from("sales_receipts").update({ status: "rejected" }).eq("id", receiptId);
    toast({ title: "Receipt Rejected" });
    fetchAll();
  };

  const filteredStaff = staff.filter((s) => {
    const q = searchQuery.toLowerCase();
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q);
  });

  const hasClockedIn = todayAttendance?.clock_in;
  const hasClockedOut = todayAttendance?.clock_out;
  const formatTime = (t: string | null) => t ? new Date(t).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSnowfall />
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {staffProfile?.first_name || user?.email} — HR Management</p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardHolidayBanner />
            <Button variant="outline" size="icon" onClick={fetchAll}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
          </div>
        </div>

        {/* Clock In/Out */}
        {staffProfile && (
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Attendance — {currentTime.toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-mono font-bold">{currentTime.toLocaleTimeString("en-KE")}</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Clock In</p>
                    <p className="text-lg font-mono font-semibold">{formatTime(todayAttendance?.clock_in || null)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Clock Out</p>
                    <p className="text-lg font-mono font-semibold">{formatTime(todayAttendance?.clock_out || null)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!hasClockedIn ? (
                    <Button onClick={handleClockIn} disabled={clockingIn} size="lg"><LogIn className="h-4 w-4 mr-2" />Clock In</Button>
                  ) : !hasClockedOut ? (
                    <Button onClick={handleClockOut} disabled={clockingIn} size="lg" variant="destructive"><LogOutIcon className="h-4 w-4 mr-2" />Clock Out</Button>
                  ) : (
                    <Badge variant="secondary" className="text-sm px-4 py-2">✅ Attendance Complete</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Staff</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalStaff}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Staff</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeStaff}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Payroll</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingPayroll}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Receipts</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingReceipts}</div></CardContent></Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/admin/hr/attendance")}><Clock className="mr-2 h-4 w-4" />Attendance</Button>
          <Button variant="outline" onClick={() => navigate("/admin/hr/payroll")}><DollarSign className="mr-2 h-4 w-4" />Payroll</Button>
          <Button variant="outline" onClick={() => navigate("/admin/hr/documents")}><FolderOpen className="mr-2 h-4 w-4" />Documents</Button>
        </div>

        <Tabs defaultValue="staff">
          <TabsList><TabsTrigger value="staff">Staff List</TabsTrigger><TabsTrigger value="attendance">Today's Attendance</TabsTrigger><TabsTrigger value="receipts">Receipt Approvals</TabsTrigger></TabsList>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <CardTitle>Staff Members</CardTitle>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredStaff.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell><Badge variant="outline">{s.role?.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell>{s.department}</TableCell>
                        <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader><CardTitle>Today's Attendance — {new Date().toLocaleDateString("en-KE")}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Staff ID</TableHead><TableHead>Status</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attendance.map((a: any) => {
                      const staffMember = staff.find((s) => s.id === a.staff_id);
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : a.staff_id}</TableCell>
                          <TableCell><Badge variant={a.status === "present" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                          <TableCell>{formatTime(a.clock_in)}</TableCell>
                          <TableCell>{formatTime(a.clock_out)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {attendance.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No attendance records today</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <Card>
              <CardHeader><CardTitle>Receipt Approvals</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Receipt #</TableHead><TableHead>Customer</TableHead><TableHead>Car</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {pendingReceipts.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.receipt_number}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.car_make} {r.car_model}</TableCell>
                        <TableCell>KES {r.amount?.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                        <TableCell>
                          {r.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleApproveReceipt(r.id)}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectReceipt(r.id)}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingReceipts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No receipts</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
