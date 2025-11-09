import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, User, LogOut, Home as HomeIcon, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        fetchUserRole(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/catalogue", label: "CATALOGUE" },
    { to: "/videos", label: "Videos" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const isDashboard = location.pathname.includes("dashboard");
  const dashboardPath = userRole === "admin" ? "/admin-dashboard" : "/customer-dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Justice Ultimate Automobiles" className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent hidden sm:block">
              JUSTICE ULTIMATE AUTO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-md text-sm font-medium text-foreground/90 hover:bg-white/5 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Home Icon - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Home"
            >
              <Link to="/">
                <HomeIcon className="h-5 w-5" />
              </Link>
            </Button>

            {/* Dashboard Icon - Show when authenticated and not on dashboard */}
            {isAuthenticated && !isDashboard && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Dashboard"
              >
                <Link to={dashboardPath}>
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-6 space-y-2 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-md text-sm font-medium text-foreground/90 hover:bg-white/5 hover:text-primary transition-colors"
              >
                {link.label}
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
                <Button variant="destructive" className="w-full mt-2" onClick={handleSignOut}>
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
        )}
      </div>
    </header>
  );
};

export default Header;
