import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Heart, Car, Calendar, User, Settings, LogOut, Award, Home, Search, ShoppingCart, MessageSquare, Sun, Moon, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth, getGreeting } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { supabase } from "@/integrations/supabase/client";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";
import LoadingScreen from "@/components/LoadingScreen";
import { CustomerLoyaltyBadge } from "@/components/CustomerLoyaltyBadge";
import { LiveChatWidget } from "@/components/LiveChatWidget";
import logo from "@/assets/logo.png";
import { setTheme, Theme } from "@/lib/theme";
import HolidayBanner from "@/components/HolidayBanner";

const CustomerDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "dark";
  });

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
      const { data: wishlist } = await supabase
        .from("wishlist")
        .select("*, cars(*)")
        .eq("user_id", user.id);
      
      setWishlistCount(wishlist?.length || 0);
      setWishlistCars(wishlist || []);

      const { data: rentals } = await supabase
        .from("rentals")
        .select("*, cars(*)")
        .eq("user_id", user.id);
      
      setRentalsCount(rentals?.length || 0);
      setRentalsCars(rentals || []);

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

  const menuItems = [
    { title: "My Dashboard", icon: Home, path: "/customer-dashboard" },
    { title: "Whitelist", icon: Heart, path: "/wishlist" },
    { title: "My Vehicles", icon: Car, path: "/customer/vehicles" },
    { title: "Bookings", icon: Calendar, path: "/customer/bookings" },
    { title: "Orders", icon: ShoppingCart, path: "/order-status" },
    { title: "Messages", icon: MessageSquare, path: "/customer/messages" },
    { title: "My Badge", icon: Award, path: "/customer/badge" },
    { title: "Settings", icon: Settings, path: "/customer/settings" },
  ];

  return (
    <SidebarProvider>
      <HolidayBanner />
      <div className="min-h-screen flex w-full">
        <SessionTimeoutModal
          isOpen={showWarning}
          timeLeft={timeLeft}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
        
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>My Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.path}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
                <h1 className="text-xl font-bold">Justice Ultimate Automobiles Customer Dashboard</h1>
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
                <Button onClick={() => navigate("/catalogue")} size="sm">Browse Catalogue</Button>
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
                      const filteredPages = menuItems.filter(page =>
                        page.title.toLowerCase().includes(searchQuery.toLowerCase())
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
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchCustomerData();
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
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-lg bg-primary/10">
                  {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{getGreeting(profile.full_name)}</h1>
                <p className="text-muted-foreground">Manage your vehicles and bookings</p>
              </div>
            </div>

            <CustomerLoyaltyBadge />

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Whitelist Items</p>
                      <h3 className="text-4xl font-bold mt-2 text-pink-900 dark:text-pink-100">
                        {showAccountDetails ? wishlistCount : "•••"}
                      </h3>
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">Vehicles saved</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-pink-200 dark:bg-pink-800 flex items-center justify-center">
                      <Heart className="h-8 w-8 text-pink-600 dark:text-pink-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Rentals</p>
                      <h3 className="text-4xl font-bold mt-2 text-blue-900 dark:text-blue-100">
                        {showAccountDetails ? rentalsCount : "•••"}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Car rentals</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">My Purchases</p>
                      <h3 className="text-4xl font-bold mt-2 text-green-900 dark:text-green-100">
                        {showAccountDetails ? purchasesCount : "•••"}
                      </h3>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Vehicles owned</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-green-600 dark:text-green-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          <Tabs defaultValue="wishlist" className="space-y-6">
            <TabsList className="glass-strong">
              <TabsTrigger value="wishlist">Whitelist</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="vehicles">My Vehicles</TabsTrigger>
            </TabsList>

            <TabsContent value="wishlist" className="space-y-4">
              {wishlistCars.length === 0 ? (
                <Card className="glass-strong">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Your whitelist is empty. Start browsing our catalogue!</p>
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
      
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleSignOut}
        onCancel={() => setShowLogoutModal(false)}
      />
      
      <LiveChatWidget />
    </SidebarProvider>
  );
};

export default CustomerDashboard;
