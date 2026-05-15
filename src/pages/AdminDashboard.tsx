import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { BarChart3, Car, Users, DollarSign, Settings, LogOut, Ban, Trash2, MessageSquare, Bell, Home, TrendingUp, Clock, Shield, Activity, Key, Search, Grid3x3, Package, ChevronRight, FileText, Video, BookOpen, UserCog, Cookie, Database, Server, Sun, Moon, Phone, Eye, EyeOff, RefreshCw, CreditCard, ThumbsUp } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NotificationsPanel from "@/components/NotificationsPanel";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";
import LoadingScreen from "@/components/LoadingScreen";
import logo from "@/assets/logo.png";
import { setTheme, Theme } from "@/lib/theme";
import DashboardHolidayBanner, { DashboardSnowfall } from "@/components/DashboardHolidayBanner";

const AdminDashboard = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>(["dashboard"]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "dark";
  });
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  const handleGenerateDailyReports = async () => {
    try {
      setIsGeneratingReports(true);
      toast({
        title: "Generating Reports",
        description: "Please wait while we generate daily reports for all staff...",
      });

      const { data, error } = await supabase.functions.invoke('generate-daily-reports');

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Daily reports generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReports(false);
    }
  };

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
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const customersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.user_id) || []
      }));

      setCustomers(customersWithRoles);
      setFilteredCustomers(customersWithRoles);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.full_name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query) ||
        customer.county_city?.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const fetchRealStats = async () => {
    const { data: carsData } = await supabase.from("cars").select("*");
    const { data: profilesData } = await supabase.from("profiles").select("*");
    
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Fetch sales for current month only
    const { data: salesData } = await supabase
      .from("sales")
      .select("*")
      .gte("sale_date", startOfMonth.toISOString().split('T')[0])
      .lte("sale_date", endOfMonth.toISOString().split('T')[0]);
    
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

  const menuGroups = [
    {
      name: "dashboard",
      label: "Dashboard",
      items: [
        { title: "Overview", icon: Home, path: "/admin-dashboard" },
        { title: "Activity Analytics", icon: Activity, path: "/admin/analytics" },
        { title: "Sales Analytics", icon: DollarSign, path: "/admin/sales" },
        { title: "Sales Forecasting", icon: TrendingUp, path: "/admin/sales/forecasting" },
      ]
    },
    {
      name: "vehicle-management",
      label: "Vehicle Management",
      items: [
        { title: "Vehicles", icon: Car, path: "/admin/cars" },
        { title: "Motorbikes", icon: Car, path: "/admin/motorbikes" },
        { title: "Vehicle Analytics", icon: TrendingUp, path: "/admin/vehicle-analytics" },
        { title: "Brands", icon: Grid3x3, path: "/admin/brands" },
        { title: "Trade-Ins", icon: Package, path: "/admin/trade-ins" },
        { title: "Rental Bookings", icon: Clock, path: "/admin/rental-management" },
        { title: "Rentals (Legacy)", icon: Clock, path: "/admin/rentals" },
      ]
    },
    {
      name: "orders-customers",
      label: "Orders & Customers",
      items: [
        { title: "Orders", icon: Package, path: "/admin/orders" },
        { title: "Customers", icon: Users, path: "/admin/customers" },
        { title: "SMS Management", icon: Phone, path: "/admin/sms" },
        { title: "CRM", icon: Activity, path: "/admin/crm" },
        { title: "Messages", icon: MessageSquare, path: "/admin/messages" },
        { title: "Staff Management", icon: UserCog, path: "/admin/staff" },
      ]
    },
    {
      name: "content-management",
      label: "Content Management",
      items: [
        { title: "Videos", icon: Video, path: "/admin/videos" },
        { title: "Blogs", icon: BookOpen, path: "/admin/blogs" },
        { title: "Notes", icon: FileText, path: "/admin/notes" },
        { title: "Social Engagement", icon: ThumbsUp, path: "/admin/social-engagement" },
      ]
    },
    {
      name: "business-intelligence",
      label: "Business Intelligence",
      items: [
        { title: "Reports", icon: BarChart3, path: "/admin/reports" },
        { title: "Daily Reports", icon: FileText, path: "/admin/daily-reports" },
        { title: "Asset Finance", icon: DollarSign, path: "/admin/asset-finance" },
        { title: "Payments", icon: CreditCard, path: "/admin/payments" },
        { title: "AI Security", icon: Shield, path: "/admin/security" },
      ]
    },
    {
      name: "hr-internal",
      label: "HR & Internal Systems",
      items: [
        { title: "HR Management", icon: UserCog, path: "/admin/hr" },
        { title: "Company Documents", icon: FileText, path: "/admin/company-documents" },
        { title: "Cookie Management", icon: Cookie, path: "/admin/cookie-management" },
      ]
    },
    {
      name: "system-settings",
      label: "System Settings",
      items: [
        { title: "Settings", icon: Settings, path: "/admin/settings" },
        { title: "System Health", icon: Activity, path: "/system-health" },
        { title: "Auth Details", icon: Key, path: "/system-auth-details" },
        { title: "Database Details", icon: Database, path: "/system-database-details" },
        { title: "Storage Details", icon: Server, path: "/system-storage-details" },
        { title: "Security Details", icon: Shield, path: "/system-security-details" },
      ]
    },
  ];

  return (
    <SidebarProvider>
      <DashboardSnowfall />
      <div className="min-h-screen flex w-full">
        
        <Sidebar collapsible="icon">
          <SidebarContent>
            <div className="px-3 py-2">
              <h2 className="mb-2 text-lg font-semibold">Admin Dashboard</h2>
            </div>
            
            {menuGroups.map((group) => (
              <Collapsible
                key={group.name}
                open={openGroups.includes(group.name)}
                onOpenChange={() => toggleGroup(group.name)}
                className="mb-1"
              >
                <SidebarGroup>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between hover:bg-accent/50 rounded-md px-2 py-1.5 cursor-pointer group">
                      <span>{group.label}</span>
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          openGroups.includes(group.name) ? 'rotate-90' : ''
                        }`} 
                      />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton onClick={() => navigate(item.path)}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))}

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setShowLogoutModal(true)} className="text-destructive">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 w-full">
          <header className="sticky top-0 z-30 flex h-auto flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <img src={logo} alt="Justice Ultimate Automobiles" className="h-10 w-auto" />
                <h1 className="text-xl font-bold">Justice Ultimate Automobiles Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Home">
                  <Home className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  title={currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  onClick={async () => {
                    const newTheme: Theme = currentTheme === "dark" ? "light" : "dark";
                    setCurrentTheme(newTheme);
                    await setTheme(newTheme, user?.id);
                  }}
                >
                  {currentTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <NotificationsPanel />
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/messages")}>
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button onClick={handleGenerateDailyReports} size="sm" disabled={isGeneratingReports}>
                  <FileText className="h-4 w-4 mr-2" />
                  {isGeneratingReports ? "Generating..." : "Generate Reports"}
                </Button>
                <Button onClick={() => navigate("/admin/cars/add")} size="sm">Add Vehicle</Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search pages..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />
                {showSearchResults && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                    {(() => {
                      const allPages = menuGroups.flatMap(group => 
                        group.items.map(item => ({ ...item, groupLabel: group.label }))
                      );
                      const filteredPages = allPages.filter(page =>
                        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        page.groupLabel.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      
                      if (filteredPages.length === 0) {
                        return (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            No pages found for "{searchQuery}"
                          </div>
                        );
                      }
                      
                      return filteredPages.map((page, index) => (
                        <button
                          key={index}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors"
                          onClick={() => {
                            navigate(page.path);
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                        >
                          <page.icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{page.title}</div>
                            <div className="text-xs text-muted-foreground">{page.groupLabel}</div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
              <DashboardHolidayBanner />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchCustomers();
                  fetchRealStats();
                  toast({ title: "Refreshed", description: "Dashboard data has been refreshed" });
                }}
                title="Refresh Dashboard"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Admin"} />
                <AvatarFallback className="text-lg bg-primary/10">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "AD"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{getGreeting(profile.full_name)}</h1>
                <p className="text-muted-foreground">Admin Dashboard — {new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Account Overview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAccountDetails(!showAccountDetails)}
                className="flex items-center gap-2"
              >
                {showAccountDetails ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800"
                onClick={() => navigate("/admin/cars")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Vehicles</p>
                      <h3 className="text-4xl font-bold mt-2 text-orange-900 dark:text-orange-100">
                        {showAccountDetails ? stats.totalVehicles : "•••"}
                      </h3>
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
                      <h3 className="text-4xl font-bold mt-2 text-blue-900 dark:text-blue-100">
                        {showAccountDetails ? stats.activeCustomers : "•••"}
                      </h3>
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
                      <h3 className="text-2xl font-bold mt-2 text-green-900 dark:text-green-100">
                        {showAccountDetails ? `KSh ${stats.monthlySales.toLocaleString('en-KE')}` : "KSh •••••"}
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
                      <h3 className="text-4xl font-bold mt-2 text-pink-900 dark:text-pink-100">
                        {showAccountDetails ? stats.whitelistOrders : "•••"}
                      </h3>
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">Awaiting review</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-pink-200 dark:bg-pink-800 flex items-center justify-center">
                      <Package className="h-8 w-8 text-pink-600 dark:text-pink-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                      {filteredCustomers.length === 0 && searchQuery ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No customers found matching "{searchQuery}"
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
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
                      )))}
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

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleSignOut}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SidebarProvider>
  );
};

export default AdminDashboard;
