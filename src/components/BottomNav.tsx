import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16">
        <Link to="/" className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${isActive("/") ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"}`}>
            <Home className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive("/") ? "text-slate-900" : "text-slate-400"}`}>Home</span>
        </Link>

        <Link to="/catalogue" className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${isActive("/catalogue") ? "bg-brand-red text-white shadow-lg" : "text-slate-500 hover:text-brand-red"}`}>
            <Search className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive("/catalogue") ? "text-brand-red" : "text-slate-400"}`}>Catalogue</span>
        </Link>

        <Link to="/wishlist" className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${isActive("/wishlist") ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-emerald-600"}`}>
            <Heart className="h-5 w-5" />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive("/wishlist") ? "text-emerald-600" : "text-slate-400"}`}>Wishlist</span>
        </Link>

        <Link to={user ? "/customer-dashboard" : "/auth"} className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${isActive("/customer-dashboard") || isActive("/auth") ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-blue-600"}`}>
            {user ? <LayoutDashboard className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive("/customer-dashboard") || isActive("/auth") ? "text-blue-600" : "text-slate-400"}`}>
            {user ? "Portal" : "Sign In"}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
