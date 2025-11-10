import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchAttendance();
      fetchStaff();
    }
  }, [user, role, selectedDate]);

  const fetchAttendance = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("attendance")
      .select("*, staff(*)")
      .eq("date", dateStr)
      .order("clock_in", { ascending: false });

    if (!error && data) {
      setAttendance(data);
    }
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("*").eq("status", "active");
    if (data) setStaff(data);
  };

  const clockIn = async (staffId: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { error } = await supabase.from("attendance").insert({
      staff_id: staffId,
      date: dateStr,
      clock_in: now,
      status: "present",
    });

    if (!error) {
      toast({
        title: "Clocked In",
        description: "Staff member clocked in successfully.",
      });
      fetchAttendance();
    } else {
      toast({
        title: "Error",
        description: "Failed to clock in.",
        variant: "destructive",
      });
    }
  };

  const clockOut = async (attendanceId: string) => {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("attendance")
      .update({ clock_out: now })
      .eq("id", attendanceId);

    if (!error) {
      toast({
        title: "Clocked Out",
        description: "Staff member clocked out successfully.",
      });
      fetchAttendance();
    } else {
      toast({
        title: "Error",
        description: "Failed to clock out.",
        variant: "destructive",
      });
    }
  };

  const markAbsent = async (staffId: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    const { error } = await supabase.from("attendance").insert({
      staff_id: staffId,
      date: dateStr,
      status: "absent",
    });

    if (!error) {
      toast({
        title: "Marked Absent",
        description: "Staff member marked as absent.",
      });
      fetchAttendance();
    }
  };

  const getAttendanceForStaff = (staffId: string) => {
    return attendance.find(a => a.staff_id === staffId);
  };

  const calculateHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "In Progress";
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(2)} hrs`;
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/hr")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Attendance Management</h1>
              <p className="text-muted-foreground">Track staff attendance and working hours</p>
            </div>
          </div>
          <Clock className="h-8 w-8 text-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 glass-strong">
            <CardHeader>
              <CardTitle>Attendance for {selectedDate.toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => {
                    const record = getAttendanceForStaff(member.id);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>
                          {record ? (
                            <Badge variant={record.status === "present" ? "default" : "secondary"}>
                              {record.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Recorded</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {record?.clock_in ? new Date(record.clock_in).toLocaleTimeString() : "-"}
                        </TableCell>
                        <TableCell>
                          {record?.clock_out ? new Date(record.clock_out).toLocaleTimeString() : "-"}
                        </TableCell>
                        <TableCell>
                          {record?.clock_in ? calculateHours(record.clock_in, record.clock_out) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!record && (
                              <>
                                <Button size="sm" onClick={() => clockIn(member.id)}>
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Clock In
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => markAbsent(member.id)}>
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Absent
                                </Button>
                              </>
                            )}
                            {record && !record.clock_out && (
                              <Button size="sm" variant="outline" onClick={() => clockOut(record.id)}>
                                Clock Out
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
