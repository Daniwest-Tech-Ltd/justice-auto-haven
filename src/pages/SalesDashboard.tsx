import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Clock, DollarSign, LogOut, RefreshCw, Search, FileText, ShoppingCart, TrendingUp, LogIn, LogOutIcon } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import DashboardHolidayBanner, { DashboardSnowfall } from "@/components/DashboardHolidayBanner";

export default function SalesDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cars, setCars] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [stats, setStats] = useState({ totalCars: 0, availableCars: 0, soldCars: 0, activeOrders: 0 });

  useEffect(() => {
    if (user) {
      fetchAll();
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const fetchAll = async () => {
    // Fetch staff profile
    const { data: sp } = await supabase.from("staff").select("*").eq("user_id", user?.id).maybeSingle();
    setStaffProfile(sp);

    if (sp) {
      const today = new Date().toISOString().split("T")[0];
      const { data: ta } = await supabase.from("attendance").select("*").eq("staff_id", sp.id).eq("date", today).maybeSingle();
      setTodayAttendance(ta);
    }

    // Fetch cars
    const { data: carsData } = await supabase.from("cars").select("*").order("created_at", { ascending: false });
    if (carsData) setCars(carsData);

    // Fetch orders
    const { data: ordersData } = await supabase.from("customer_orders").select("*").order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);

    // Stats
    setStats({
      totalCars: carsData?.length || 0,
      availableCars: carsData?.filter((c: any) => c.status === "available" || !c.status).length || 0,
      soldCars: carsData?.filter((c: any) => c.status === "sold").length || 0,
      activeOrders: ordersData?.filter((o: any) => o.status !== "completed" && o.status !== "cancelled").length || 0,
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

      // Send clock-in notification
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

  const filteredCars = cars.filter((c) => {
    const q = searchQuery.toLowerCase();
    return `${c.make} ${c.model}`.toLowerCase().includes(q) || c.stock_id?.toLowerCase().includes(q);
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
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {staffProfile?.first_name || user?.email} — Sales & Marketing</p>
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
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Cars</CardTitle><Car className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalCars}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Available</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.availableCars}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Sold</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.soldCars}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Orders</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeOrders}</div></CardContent></Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/admin/sales-management")}><DollarSign className="mr-2 h-4 w-4" />Sales Management</Button>
          <Button variant="outline" onClick={() => navigate("/admin/sales-orders")}><ShoppingCart className="mr-2 h-4 w-4" />Order Management</Button>
          <Button variant="outline" onClick={() => navigate("/admin/cars")}><Car className="mr-2 h-4 w-4" />Car Management</Button>
        </div>

        <Tabs defaultValue="cars">
          <TabsList><TabsTrigger value="cars">Car Inventory</TabsTrigger><TabsTrigger value="orders">Orders</TabsTrigger></TabsList>

          <TabsContent value="cars">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <CardTitle>Car Inventory</CardTitle>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search cars..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Stock ID</TableHead><TableHead>Car</TableHead><TableHead>Year</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredCars.slice(0, 20).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.stock_id || "—"}</TableCell>
                        <TableCell className="font-medium">{c.make} {c.model}</TableCell>
                        <TableCell>{c.year}</TableCell>
                        <TableCell>KES {c.price?.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={c.status === "sold" ? "destructive" : c.status === "reserved" ? "secondary" : "default"}>{c.status || "available"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader><CardTitle>Customer Orders</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Car</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders.slice(0, 20).map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.car_make} {o.car_model}</TableCell>
                        <TableCell>{o.customer_id?.slice(0, 8)}...</TableCell>
                        <TableCell><Badge variant={o.status === "completed" ? "default" : "secondary"}>{o.status?.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleDateString("en-KE")}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => navigate("/admin/sales-orders")}>Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No orders</TableCell></TableRow>}
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
