import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BarChart3, Car, Users, DollarSign, Settings, LogOut, Ban, Trash2, MessageSquare, Bell, Home, TrendingUp, Clock, Shield, Activity, Key, Search, Grid3x3, Package } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NotificationsPanel from "@/components/NotificationsPanel";
import { SessionTimeoutModal } from "@/components/SessionTimeoutModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import LoadingScreen from "@/components/LoadingScreen";

const AdminDashboard = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
    return <LoadingScreen />;
  }

  if (!user || !profile || role?.role !== "admin") return null;

  const menuItems = [
    { title: "Overview", icon: Home, onClick: () => {} },
    { title: "Vehicles", icon: Car, onClick: () => navigate("/admin/cars") },
    { title: "Orders", icon: Package, onClick: () => navigate("/admin/orders") },
    { title: "Customers", icon: Users, onClick: () => navigate("/admin/customers") },
    { title: "Sales", icon: DollarSign, onClick: () => navigate("/admin/sales-analytics") },
    { title: "Sales Forecasting", icon: TrendingUp, onClick: () => navigate("/admin/sales-forecasting") },
    { title: "AI Security", icon: Shield, onClick: () => navigate("/admin/ai-security") },
    { title: "OTP Management", icon: Key, onClick: () => navigate("/admin/otp-management") },
    { title: "HR Management", icon: Users, onClick: () => navigate("/admin/hr-management") },
    { title: "Messages", icon: MessageSquare, onClick: () => navigate("/admin/messages") },
    { title: "Settings", icon: Settings, onClick: () => navigate("/admin/settings") },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SessionTimeoutModal
          isOpen={showWarning}
          timeLeft={timeLeft}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
        
        {/* Sidebar */}
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut} tooltip="Logout" className="text-destructive">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 w-full">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger />
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <Home className="h-5 w-5" />
              </Button>
              <NotificationsPanel />
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/messages")}>
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button onClick={() => navigate("/admin/cars/add")} size="sm">Add Vehicle</Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{getGreeting(profile.full_name)}</h1>
              <p className="text-muted-foreground">Welcome to Admin Dashboard</p>
            </div>

            {/* Colorful Widget Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800"
                onClick={() => navigate("/admin/cars")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Vehicles</p>
                      <h3 className="text-4xl font-bold mt-2 text-orange-900 dark:text-orange-100">{stats.totalVehicles}</h3>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">In inventory</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                      <Car className="h-8 w-8 text-orange-600 dark:text-orange-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
                onClick={() => navigate("/admin/customers")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Customers</p>
                      <h3 className="text-4xl font-bold mt-2 text-blue-900 dark:text-blue-100">{stats.activeCustomers}</h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Registered users</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
                onClick={() => navigate("/admin/sales")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Monthly Sales</p>
                      <h3 className="text-4xl font-bold mt-2 text-green-900 dark:text-green-100">
                        {(stats.monthlySales / 1000).toFixed(0)}K
                      </h3>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Total revenue</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800"
                onClick={() => navigate("/admin/orders")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Pending Orders</p>
                      <h3 className="text-4xl font-bold mt-2 text-pink-900 dark:text-pink-100">{stats.whitelistOrders}</h3>
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">Awaiting review</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-pink-200 dark:bg-pink-800 flex items-center justify-center">
                      <Package className="h-8 w-8 text-pink-600 dark:text-pink-300" />
                    </div>
                  </div>
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
    </SidebarProvider>
  );
};

export default AdminDashboard;
