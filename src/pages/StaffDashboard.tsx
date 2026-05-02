import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, Clock, LogOut, RefreshCw, LogIn, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import DashboardHolidayBanner, { DashboardSnowfall } from "@/components/DashboardHolidayBanner";

interface StaffData {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
  email: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  clock_in: string | null;
  clock_out: string | null;
}

export default function StaffDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchStaffData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (staff) { fetchAttendance(); }
  }, [staff]);

  const fetchStaffData = async () => {
    try {
      const { data, error } = await supabase.from("staff").select("*").eq("user_id", user?.id).maybeSingle();
      if (error) throw error;
      setStaff(data);
    } catch {
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!staff) return;
    const today = new Date().toISOString().split("T")[0];

    const [{ data: todayData }, { data: recentData }] = await Promise.all([
      supabase.from("attendance").select("*").eq("staff_id", staff.id).eq("date", today).maybeSingle(),
      supabase.from("attendance").select("*").eq("staff_id", staff.id).order("date", { ascending: false }).limit(7),
    ]);

    setTodayAttendance(todayData);
    setRecentAttendance(recentData || []);
  };

  const handleClockIn = async () => {
    if (!staff) return;
    setClockingIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      if (todayAttendance) {
        await supabase.from("attendance").update({ clock_in: now, status: "present" }).eq("id", todayAttendance.id);
      } else {
        await supabase.from("attendance").insert([{ staff_id: staff.id, date: today, clock_in: now, status: "present" }]);
      }

      // Send clock-in email notification
      supabase.functions.invoke("send-notifications", {
        body: {
          type: "clock_in",
          staffName: `${staff.first_name} ${staff.last_name}`,
          staffEmail: staff.email,
          time: new Date().toLocaleTimeString("en-KE"),
          date: new Date().toLocaleDateString("en-KE"),
        },
      }).catch(() => {});

      toast.success("Clocked in successfully! ✅");
      fetchAttendance();
    } catch (err: any) {
      toast.error("Failed to clock in: " + err.message);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayAttendance) return;
    setClockingIn(true);
    try {
      await supabase.from("attendance").update({ clock_out: new Date().toISOString() }).eq("id", todayAttendance.id);
      toast.success("Clocked out successfully! 👋");
      fetchAttendance();
    } catch (err: any) {
      toast.error("Failed to clock out: " + err.message);
    } finally {
      setClockingIn(false);
    }
  };

  const formatTime = (t: string | null) => t ? new Date(t).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  if (!staff) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-muted-foreground">No staff profile found. Contact your administrator.</p>
      <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
    </div>
  );

  const hasClockedIn = todayAttendance?.clock_in;
  const hasClockedOut = todayAttendance?.clock_out;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSnowfall />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{getGreeting(staff.first_name)}</h1>
            <p className="text-muted-foreground capitalize">{staff.role?.replace(/_/g, " ")} • {staff.department} • {new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardHolidayBanner />
            <Button variant="outline" size="icon" onClick={() => { fetchStaffData(); fetchAttendance(); toast.success("Refreshed"); }}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
          </div>
        </div>

        {/* Clock-in/out Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Attendance — {currentTime.toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-mono font-bold">{currentTime.toLocaleTimeString("en-KE")}</p>
                <p className="text-sm text-muted-foreground mt-1">Current Time</p>
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
                  <Button onClick={handleClockIn} disabled={clockingIn} size="lg" className="bg-primary">
                    <LogIn className="h-4 w-4 mr-2" />Clock In
                  </Button>
                ) : !hasClockedOut ? (
                  <Button onClick={handleClockOut} disabled={clockingIn} size="lg" variant="destructive">
                    <LogOutIcon className="h-4 w-4 mr-2" />Clock Out
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-sm px-4 py-2">✅ Attendance Complete</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAttendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{new Date(a.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>In: <span className="font-mono">{formatTime(a.clock_in)}</span></span>
                    <span>Out: <span className="font-mono">{formatTime(a.clock_out)}</span></span>
                    <Badge variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"}>{a.status}</Badge>
                  </div>
                </div>
              ))}
              {recentAttendance.length === 0 && <p className="text-center text-muted-foreground py-4">No attendance records yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
