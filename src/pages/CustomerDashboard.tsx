import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Car, Calendar, User, Settings, Menu, X, LogOut } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const CustomerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

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

  if (!user || !profile) return null;

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
          <h2 className="text-2xl font-bold mb-8">My Dashboard</h2>
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <User className="h-5 w-5" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Heart className="h-5 w-5" />
              Wishlist
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Car className="h-5 w-5" />
              My Vehicles
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Calendar className="h-5 w-5" />
              Bookings
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
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
              <p className="text-muted-foreground">Welcome to Customer Dashboard</p>
              <p className="text-sm text-muted-foreground mt-1">Manage your vehicles and bookings</p>
            </div>
            <Button onClick={() => navigate("/catalogue")}>Browse Catalogue</Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <p className="text-sm text-muted-foreground">Vehicles saved</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2</div>
                <p className="text-sm text-muted-foreground">Test drives scheduled</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1</div>
                <p className="text-sm text-muted-foreground">Vehicle owned</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="wishlist" className="space-y-6">
            <TabsList className="glass-strong">
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="vehicles">My Vehicles</TabsTrigger>
            </TabsList>

            <TabsContent value="wishlist" className="space-y-4">
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle>Your Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your saved vehicles will appear here...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle>Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your test drive bookings will appear here...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-4">
              <Card className="glass-strong">
                <CardHeader>
                  <CardTitle>My Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your owned vehicles will appear here...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
