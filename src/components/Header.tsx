import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, Moon, Sun, User, LogOut, LayoutDashboard, Heart, Bell, Mail, Download, ShieldCheck, Globe, Trophy, Shield, Car,
  ChevronDown, CreditCard, RefreshCw, Newspaper, Video, ChevronRight, ChevronUp, ChevronLeft
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import logo from "@/assets/logo.png";
import christmasHat from "@/assets/christmas-hat.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import { BusinessHours } from "./BusinessHours";
import { ChristmasHat } from "./SeasonalEffects";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "./ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [servicesOpen, setServicesOpen] = useState(false);

  

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    checkAuth();
    fetchCounts();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        fetchUserRole(session.user.id);
        fetchCounts();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUserRole(null);
        setWishlistCount(0);
        setNotificationCount(0);
        setMessageCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const fetchCounts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    
    if (user) {
      // Fetch wishlist count
      const { count: wCount } = await supabase
        .from("wishlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setWishlistCount(wCount || 0);

      // Fetch unread notifications
      const { count: nCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotificationCount(nCount || 0);

      // Fetch unread messages
      const { count: mCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setMessageCount(mCount || 0);
    } else {
      // For non-logged in users, get wishlist from localStorage
      const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistCount(local.length);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      fetchUserRole(session.user.id);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    setUserRole(data?.role || null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    toast({
      title: "Signed out successfully",
    });
    navigate("/");
    setShowLogoutConfirm(false);
  };

  const initiateLogout = () => {
    setShowLogoutConfirm(true);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/catalogue", label: "Catalogue" },
    { to: "/contact", label: "Contact" },
  ];

  const serviceLinks = [
    { to: "/asset-finance", label: "Financing", icon: CreditCard },
    { to: "/trade-in", label: "Trade In", icon: RefreshCw },
    { to: "/blogs", label: "News & Reviews", icon: Newspaper },
    { to: "/videos", label: "Videos", icon: Video },
  ];

  const isDashboard = location.pathname.includes("dashboard");
  const dashboardPath = userRole === "admin" ? "/admin-dashboard" : "/customer-dashboard";

  return (
    <TooltipProvider>
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-12 w-12 transition-transform duration-500 group-hover:scale-110">
              <img src={logo} alt="Justice Ultimate Automobiles" className="h-12 w-12 object-contain shadow-sm" />
              <ChristmasHat hatImage={christmasHat} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent hidden sm:block leading-none">
                JUSTICE ULTIMATE
              </span>
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-brand-red hidden sm:block">
                Automobiles
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                location.pathname === "/"
                  ? "text-white bg-slate-900 shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Home
            </Link>

            <Link
              to="/catalogue"
              className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                location.pathname === "/catalogue"
                  ? "text-white bg-brand-red shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:text-brand-red hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Car className={`h-3.5 w-3.5 ${location.pathname === "/catalogue" ? "text-white" : "text-brand-red"} animate-car-move`} />
              Catalogue
            </Link>

            {/* Services Dropdown */}
            <DropdownMenu open={servicesOpen} onOpenChange={setServicesOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-4 py-2 h-auto rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 gap-2 ${
                    serviceLinks.some(link => location.pathname === link.to)
                      ? "text-white bg-slate-900 dark:bg-slate-800"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Solutions
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${servicesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-72 p-[2.5px] bg-white dark:bg-slate-900 border-none rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 relative overflow-hidden"
              >
                {/* Hazard Pattern Border - Slightly larger crawling edge */}
                <div className="absolute inset-0 animate-hazard-border"
                     style={{
                       backgroundImage: 'repeating-linear-gradient(-45deg, #ef4444, #ef4444 6px, #fbbf24 6px, #fbbf24 12px)'
                     }}
                />

                <div className="relative z-10 bg-white dark:bg-slate-900 rounded-[calc(1rem-2.5px)] p-3 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Operational Desk</p>
                    <h4 className="text-[11px] font-black uppercase text-slate-400">Institutional Solutions</h4>
                  </div>
                  {serviceLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.to}
                    className="p-0 focus:bg-transparent"
                    onSelect={() => navigate(link.to)}
                  >
                    <Link
                      to={link.to}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        location.pathname === link.to
                          ? "bg-slate-100 dark:bg-slate-800 text-brand-red"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:translate-x-1"
                      }`}
                    >
                      <link.icon className="h-4 w-4 text-brand-red" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/contact"
              className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                location.pathname === "/contact"
                  ? "text-white bg-slate-900 shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Business Hours */}
            <BusinessHours />
            
            {/* Download APK Button - Signal Animation */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open("https://loadly.io/justice-auto-app", "_blank")}
                  aria-label="Download App"
                  className="relative border border-brand-red/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-vertical-bounce"
                >
                  <Download className="h-5 w-5 text-brand-red" />
                  <span className="absolute inset-0 rounded-full animate-ping-slow border border-brand-red/30 pointer-events-none" />
                  <span className="absolute -inset-1 rounded-full animate-ping border border-brand-red/20 pointer-events-none" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Android APK</p>
              </TooltipContent>
            </Tooltip>

            <style>{`
              @keyframes car-move {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(3px); }
              }
              .animate-car-move {
                animation: car-move 2s infinite ease-in-out;
              }
              @keyframes vertical-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              .animate-vertical-bounce {
                animation: vertical-bounce 2s infinite ease-in-out;
              }
              @keyframes ping-slow {
                0% { transform: scale(1); opacity: 1; }
                70%, 100% { transform: scale(1.5); opacity: 0; }
              }
              .animate-ping-slow {
                animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
              }
              @keyframes marquee-professional {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-professional {
                animation: marquee-professional 40s linear infinite;
              }

              /* Hazard Pattern Border Animation */
              @keyframes hazard-border-move {
                0% { background-position: 0 0; }
                100% { background-position: 32px 32px; }
              }
              .animate-hazard-border {
                animation: hazard-border-move 1s linear infinite;
              }
            `}</style>

            {/* Whitelist Icon - Always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Whitelist"
                  className="relative border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                >
                  <Link to="/wishlist">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {wishlistCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Whitelist</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications - Show when authenticated and is customer */}
            {isAuthenticated && userRole === "customer" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label="Notifications"
                      className="relative border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                    >
                      <Link to="/customer/notifications">
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {notificationCount}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifications</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label="Messages"
                      className="relative border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                    >
                      <Link to="/customer/messages">
                        <Mail className="h-5 w-5" />
                        {messageCount > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {messageCount}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Messages</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Dashboard Icon - Show when authenticated and not on dashboard */}
            {isAuthenticated && !isDashboard && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label="Dashboard"
                    className="border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                  >
                    <Link to={dashboardPath}>
                      <LayoutDashboard className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dashboard</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={initiateLogout}
                    aria-label="Sign Out"
                    className="border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link to="/auth" className="hidden sm:block">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]">
                      <User className="h-4 w-4" />
                      Sign In
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign In</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                  className="border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{darkMode ? "Light Mode" : "Dark Mode"}</p>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent ref={drawerRef} className="h-[80vh] max-w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <DrawerHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold">Menu</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          
          <div className="overflow-y-auto p-4 space-y-2">
            {/* Main Links */}
            {[
              { to: "/", label: "Home" },
              { to: "/catalogue", label: "Catalogue" },
              { to: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative block px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  location.pathname === link.to
                    ? "text-white bg-slate-900 shadow-lg"
                    : "text-slate-600 border border-slate-100 hover:bg-slate-50"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}

            {/* Service Links Group */}
            <div className="pt-4 pb-2">
               <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-brand-red mb-3">Our Services</p>
               <div className="grid grid-cols-1 gap-2">
                  {serviceLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        location.pathname === link.to
                          ? "text-white bg-brand-red shadow-lg"
                          : "text-slate-600 border border-slate-100"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
               </div>
            </div>

            {isAuthenticated ? (
              <>
                {!isDashboard && (
                  <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full mt-4">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button variant="destructive" className="w-full mt-2" onClick={() => {
                  setMobileMenuOpen(false);
                  initiateLogout();
                }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full mt-4">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </header>


    {/* Logout Confirmation Modal */}
    <LogoutConfirmModal
      isOpen={showLogoutConfirm}
      onConfirm={handleSignOut}
      onCancel={() => setShowLogoutConfirm(false)}
    />
    </>
    </TooltipProvider>
  );
};

export default Header;
