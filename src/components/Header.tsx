import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, User, LogOut, Home as HomeIcon, LayoutDashboard, Heart, Bell, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import logo from "@/assets/logo.png";
import christmasBells from "@/assets/christmas-bells.png";
import christmasCorner from "@/assets/christmas-corner.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import { SessionTimeoutModal } from "./SessionTimeoutModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { BusinessHours } from "./BusinessHours";
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

  const { showWarning, timeLeft, extendSession, handleLogout: sessionLogout } = useSessionTimeout();

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
    const { data: { user } } = await supabase.auth.getUser();
    
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
    { to: "/catalogue", label: "CATALOGUE" },
    { to: "/videos", label: "Videos" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const isDashboard = location.pathname.includes("dashboard");
  const dashboardPath = userRole === "admin" ? "/admin-dashboard" : "/customer-dashboard";

  return (
    <TooltipProvider>
    <>
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      {/* Christmas Corner Decoration - Right side */}
      <img 
        src={christmasCorner} 
        alt="" 
        className="absolute top-14 right-[60%] w-10 md:w-12 h-10 md:h-12 z-10 pointer-events-none offer-badge"
      />
      
      {/* Christmas Bells - Far right corner */}
      <img 
        src={christmasBells} 
        alt="" 
        className="absolute top-12 right-4 w-20 md:w-28 h-auto z-10 pointer-events-none offer-badge"
      />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Justice Ultimate Automobiles" className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent hidden sm:block">
              JUSTICE ULTIMATE AUTOMOBILES
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 overflow-hidden group shadow-[0_4px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)] border border-primary/20"
                    : "text-foreground/90 hover:bg-white/5 hover:text-primary border border-border/50"
                }`}
              >
                {location.pathname === link.to && (
                  <span className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite] bg-primary/20 rounded-md" />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Business Hours */}
            <BusinessHours />
            
            {/* Home Icon - Always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Home"
                  className="border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)] hover:shadow-[0_0_15px_rgba(34,197,94,0.7)]"
                >
                  <Link to="/">
                    <HomeIcon className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>

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
                className={`relative block px-4 py-3 rounded-md text-sm font-medium transition-all duration-300 overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)] border border-primary/20"
                    : "text-foreground/90 hover:bg-accent hover:text-accent-foreground border border-border/50"
                }`}
              >
                {location.pathname === link.to && (
                  <span className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite] bg-primary/20 rounded-md" />
                )}
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

    {/* Session Timeout Modal */}
    {isAuthenticated && (
      <SessionTimeoutModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        onExtend={extendSession}
        onLogout={sessionLogout}
      />
    )}

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
