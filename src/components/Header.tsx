import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, User, LogOut, LayoutDashboard, Heart, Bell, Mail, Download, ShieldCheck, Globe, Trophy, Shield } from "lucide-react";
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
    { to: "/asset-finance", label: "Financing" },
    { to: "/trade-in", label: "Trade In" },
    { to: "/blogs", label: "News & Reviews" },
    { to: "/videos", label: "Videos" },
    { to: "/contact", label: "Contact" },
  ];

  const isDashboard = location.pathname.includes("dashboard");
  const dashboardPath = userRole === "admin" ? "/admin-dashboard" : "/customer-dashboard";

  return (
    <TooltipProvider>
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-12 w-12 transition-transform duration-500 group-hover:scale-110">
              <img src={logo} alt="Justice Ultimate Automobiles" className="h-12 w-12 object-contain" />
              <ChristmasHat hatImage={christmasHat} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block leading-none">
                JUSTICE ULTIMATE
              </span>
              <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-muted-foreground hidden sm:block">
                Automobiles
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all duration-300 ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/5 shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/50 border border-transparent hover:border-border"
                }`}
              >
                {link.label}
              </Link>
            ))}
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
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative block px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/5 border border-primary/20"
                    : "text-muted-foreground border border-transparent hover:bg-secondary/50"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
            
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
