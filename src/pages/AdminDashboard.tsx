import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Car, Users, DollarSign, Settings, Menu, X, LogOut, Ban, Trash2 } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || role?.role !== "admin")) {
      navigate("/auth");
    }
  }, [loading, user, role, navigate]);

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchCustomers();
    }
  }, [user, role]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles(role)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCustomers(data);
    }
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
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <BarChart3 className="h-5 w-5" />
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
              onClick={() => navigate("/admin/settings")}
            >
              <Settings className="h-5 w-5" />
              Settings
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
            <div className="flex gap-2">
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
                <div className="text-3xl font-bold">248</div>
                <p className="text-sm text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,842</div>
                <p className="text-sm text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">KSh 45M</div>
                <p className="text-sm text-muted-foreground">+25% from last month</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">23</div>
                <p className="text-sm text-muted-foreground">-5% from last month</p>
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
                  <CardTitle>Recent Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Vehicle management interface would go here...</p>
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
                  <CardTitle>Sales Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Sales charts and analytics would go here...</p>
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
