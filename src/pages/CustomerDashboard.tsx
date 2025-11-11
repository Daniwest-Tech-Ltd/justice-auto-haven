import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Car, Calendar, User, Settings, Menu, X, LogOut, Award, Home } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SessionTimeoutModal } from "@/components/SessionTimeoutModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

const CustomerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showWarning, timeLeft, extendSession, handleLogout } = useSessionTimeout();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [rentalsCount, setRentalsCount] = useState(0);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [wishlistCars, setWishlistCars] = useState<any[]>([]);
  const [rentalsCars, setRentalsCars] = useState<any[]>([]);
  const [purchasedCars, setPurchasedCars] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (user) {
      fetchCustomerData();
    }
  }, [loading, user, navigate]);

  const fetchCustomerData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      // Fetch wishlist
      const { data: wishlist } = await supabase
        .from("wishlist")
        .select("*, cars(*)")
        .eq("user_id", user.id);
      
      setWishlistCount(wishlist?.length || 0);
      setWishlistCars(wishlist || []);

      // Fetch rentals
      const { data: rentals } = await supabase
        .from("rentals")
        .select("*, cars(*)")
        .eq("user_id", user.id);
      
      setRentalsCount(rentals?.length || 0);
      setRentalsCars(rentals || []);

      // Fetch purchases
      const { data: sales } = await supabase
        .from("sales")
        .select("*, cars(*)")
        .eq("customer_id", user.id);
      
      setPurchasesCount(sales?.length || 0);
      setPurchasedCars(sales || []);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setDataLoading(false);
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

  if (loading || dataLoading) {
    return <LoadingScreen />;
  }

  if (!user || !profile) return null;

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
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/customer/badge")}
            >
              <Award className="h-5 w-5" />
              My Badge
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate("/customer/profile")}
            >
              <Settings className="h-5 w-5" />
              Edit Profile
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
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" />
            </Button>
            <Button onClick={() => navigate("/catalogue")}>Browse Catalogue</Button>
          </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{wishlistCount}</div>
                <p className="text-sm text-muted-foreground">Vehicles saved</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{rentalsCount}</div>
                <p className="text-sm text-muted-foreground">Car rentals</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="text-sm font-medium">My Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{purchasesCount}</div>
                <p className="text-sm text-muted-foreground">Vehicles owned</p>
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
              {wishlistCars.length === 0 ? (
                <Card className="glass-strong">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Your wishlist is empty. Start browsing our catalogue!</p>
                    <Button onClick={() => navigate("/catalogue")} className="mt-4 mx-auto block">Browse Cars</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlistCars.map((item: any) => (
                    <Card key={item.id} className="glass-strong">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                          <img src={item.cars?.images?.[0] || "/placeholder.svg"} alt={item.cars?.model} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold">{item.cars?.make} {item.cars?.model}</h3>
                        <p className="text-sm text-muted-foreground">{item.cars?.year}</p>
                        <p className="text-lg font-semibold text-primary mt-2">KSH {item.cars?.price?.toLocaleString()}</p>
                        <Link to={`/car/${item.cars?.stock_id || item.cars?.id}`}>
                          <Button className="w-full mt-3" size="sm">View Details</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              {rentalsCars.length === 0 ? (
                <Card className="glass-strong">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">No active rentals</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {rentalsCars.map((rental: any) => (
                    <Card key={rental.id} className="glass-strong">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img src={rental.cars?.images?.[0] || "/placeholder.svg"} alt={rental.cars?.model} className="w-24 h-24 object-cover rounded" />
                          <div className="flex-1">
                            <h3 className="font-bold">{rental.cars?.make} {rental.cars?.model}</h3>
                            <p className="text-sm text-muted-foreground">From: {new Date(rental.start_date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">To: {new Date(rental.end_date).toLocaleDateString()}</p>
                            <p className="text-lg font-semibold text-primary mt-1">KSH {rental.total_price?.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-4">
              {purchasedCars.length === 0 ? (
                <Card className="glass-strong">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">No purchased vehicles yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchasedCars.map((sale: any) => (
                    <Card key={sale.id} className="glass-strong">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                          <img src={sale.cars?.images?.[0] || "/placeholder.svg"} alt={sale.cars?.model} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold">{sale.cars?.make} {sale.cars?.model}</h3>
                        <p className="text-sm text-muted-foreground">Purchased: {new Date(sale.sale_date).toLocaleDateString()}</p>
                        <p className="text-lg font-semibold text-primary mt-2">KSH {sale.sale_price?.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
