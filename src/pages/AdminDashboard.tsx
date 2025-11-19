import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Car, Users, DollarSign, Settings, Menu, X, LogOut, Ban, Trash2, MessageSquare, Bell, Home, TrendingUp, Clock, Shield, Activity } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NotificationsPanel from "@/components/NotificationsPanel";
import { SessionTimeoutModal } from "@/components/SessionTimeoutModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showWarning, timeLeft, extendSession, handleLogout } = useSessionTimeout();

  useEffect(() => {
    if (!loading && (!user || role?.role !== "admin")) {
      navigate("/auth");
    }
  }, [loading, user, role, navigate]);

  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeCustomers: 0,
    monthlySales: 0,
    whitelistOrders: 0,
  });

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchCustomers();
      fetchRealStats();
    }
  }, [user, role]);

  const fetchCustomers = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const customersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.user_id) || []
      }));

      setCustomers(customersWithRoles);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchRealStats = async () => {
    const { data: carsData } = await supabase.from("cars").select("*");
    const { data: profilesData } = await supabase.from("profiles").select("*");
    const { data: salesData } = await supabase.from("sales").select("*");
    const { data: whitelistData } = await supabase.from("whitelist_orders").select("*").eq("status", "pending");

    setStats({
      totalVehicles: carsData?.length || 0,
      activeCustomers: profilesData?.length || 0,
      monthlySales: salesData?.reduce((sum, s) => sum + (typeof s.sale_price === 'string' ? parseFloat(s.sale_price) : s.sale_price), 0) || 0,
      whitelistOrders: whitelistData?.length || 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !profile || role?.role !== "admin") return null;

  return (
    <div className="min-h-screen relative">
      <SessionTimeoutModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden glass"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 glass-strong border-r border-white/10 z-40 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">Admin Dashboard</h2>
          <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-5 w-5" />
              Overview
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/cars")}
            >
              <Car className="h-5 w-5" />
              Vehicles
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/orders")}
            >
              <Clock className="h-5 w-5" />
              Orders
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/customers")}
            >
              <Users className="h-5 w-5" />
              Customers
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/sales")}
            >
              <DollarSign className="h-5 w-5" />
              Sales
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/sales/forecasting")}
            >
              <TrendingUp className="h-5 w-5" />
              Sales Forecasting
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/security")}
            >
              <Shield className="h-5 w-5" />
              AI Security
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/hr")}
            >
              <Users className="h-5 w-5" />
              HR Management
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/reports")}
            >
              <BarChart3 className="h-5 w-5" />
              Daily Reports
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/live-attendance")}
            >
              <Clock className="h-5 w-5" />
              Live Attendance
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/performance")}
            >
              <TrendingUp className="h-5 w-5" />
              Staff Performance
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/crm")}
            >
              <Users className="h-5 w-5" />
              CRM
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/system-health")}
            >
              <Activity className="h-5 w-5" />
              System Health
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/cookie-management")}
            >
              🍪 Cookie Management
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/settings")}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/messages")}
            >
              <MessageSquare className="h-5 w-5" />
              Messages
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">{getGreeting(profile.full_name)}</h1>
              <p className="text-muted-foreground">Welcome to Admin Dashboard</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate("/")}
              >
                <Home className="h-5 w-5" />
              </Button>
              <NotificationsPanel />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/admin/messages")}
                className="relative"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button onClick={() => navigate("/admin/cars/add")}>Add Vehicle</Button>
              <Button variant="outline" onClick={() => navigate("/admin/videos")}>Manage Videos</Button>
              <Button variant="outline" onClick={() => navigate("/admin/brands")}>Brands</Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalVehicles}</div>
                <p className="text-sm text-muted-foreground">Total inventory</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeCustomers}</div>
                <p className="text-sm text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">KSh {stats.monthlySales.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total revenue</p>
              </CardContent>
            </Card>

            <Card 
              className="glass-strong cursor-pointer hover:border-primary transition-colors" 
              onClick={() => navigate("/admin/orders")}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Orders 📦
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.whitelistOrders}</div>
                <p className="text-sm text-muted-foreground">Pending orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="vehicles" className="space-y-6">
            <TabsList className="glass-strong">
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>

            <TabsContent value="vehicles" className="space-y-4">
              <Card className="glass-strong">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Vehicles</CardTitle>
                    <Button onClick={() => navigate("/admin/cars")}>View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stock ID</TableHead>
                        <TableHead>Make & Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.totalVehicles > 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            <Button variant="link" onClick={() => navigate("/admin/cars")}>
                              Click to view all vehicles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No vehicles yet. Add your first vehicle.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle>Customer Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.full_name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.county_city || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={customer.user_roles?.[0]?.role === "admin" ? "default" : "secondary"}>
                              {customer.user_roles?.[0]?.role || "customer"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(customer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card className="glass-strong">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Sales Overview</CardTitle>
                    <Button onClick={() => navigate("/admin/sales")}>View Analytics</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="glass p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">KSh {stats.monthlySales.toLocaleString()}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/admin/sales")}
                    >
                      View Detailed Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
