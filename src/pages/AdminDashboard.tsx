import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Car, Users, DollarSign, Settings, Menu, X, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Car className="h-5 w-5" />
              Vehicles
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Users className="h-5 w-5" />
              Customers
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <DollarSign className="h-5 w-5" />
              Sales
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-destructive">
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
            <h1 className="text-4xl font-bold">Dashboard Overview</h1>
            <Button>Add Vehicle</Button>
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
                  <CardTitle>Customer List</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Customer management interface would go here...</p>
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
