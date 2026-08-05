import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, MessageCircle, Car, Gauge, Settings as SettingsIcon, Heart, Shield, MapPin, Clock, CreditCard, Fuel, Navigation, ChevronRight, ChevronLeft, Star, Activity, Zap, Globe, Headphones, Maximize2, ShieldCheck, Trophy, Bike, Key, ArrowUpRight, Flame, Eye, ArrowRight } from "lucide-react";
import { PaymentMethodsModal } from "@/components/PaymentMethodsModal";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSale } from "@/lib/currentSale";
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from "@/lib/recentSearches";
import { X as XIcon, Clock as ClockIcon } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import useDisableRightClick from "@/hooks/useDisableRightClick";
import FullscreenImageViewer from "@/components/FullscreenImageViewer";
import QuickViewModal from "@/components/QuickViewModal";
import { LiveViewers, StockUrgency } from "@/components/SocialProof";
import { CarCard } from "@/components/CarCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fuel_type: string | null;
  transmission: string | null;
  mileage: string | null;
  status: string | null;
  color: string | null;
  engine: string | null;
  images: any;
  stock_id: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  yard_location: string | null;
  units_available?: number | null;
}

const Catalogue = () => {
  useDisableRightClick();
  const sale = getCurrentSale();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    brand: searchParams.get("brand") || "all",
    year: "all",
    availability: "all",
    fuelType: "all",
    priceRange: "all",
  });
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const itemsPerPage = 1000;
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches("catalogue"));
  const [showRecent, setShowRecent] = useState(false);
  const [fullscreen, setFullscreen] = useState<{ images: string[]; title: string } | null>(null);

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedQuickCar, setSelectedQuickCar] = useState<any>(null);

  // Instant scroll-to-top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const t = setTimeout(() => {
      addRecentSearch(q, "catalogue");
      setRecentSearches(getRecentSearches("catalogue"));
    }, 1200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("*").order("name");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (user) {
        const { data } = await supabase.from("wishlist").select("car_id").eq("user_id", user.id);
        return data?.map(w => w.car_id) || [];
      }
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    },
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (wishlistData) setWishlist(wishlistData);
  }, [wishlistData]);

  const buildCarsQuery = () => {
    let query = supabase.from("cars").select("*", { count: 'exact' });
    if (searchQuery) {
      const q = searchQuery.trim();
      const safe = q.replace(/[,()]/g, " ");
      const conditions = [
        `make.ilike.%${safe}%`, `model.ilike.%${safe}%`, `color.ilike.%${safe}%`,
        `fuel_type.ilike.%${safe}%`, `transmission.ilike.%${safe}%`, `drive_type.ilike.%${safe}%`,
        `engine.ilike.%${safe}%`, `mileage.ilike.%${safe}%`, `stock_id.ilike.%${safe}%`,
        `vin.ilike.%${safe}%`, `description.ilike.%${safe}%`, `notes.ilike.%${safe}%`, `status.ilike.%${safe}%`,
      ];
      if (/^\d{4}$/.test(q)) conditions.push(`year.eq.${q}`);
      query = query.or(conditions.join(","));
    }
    if (filters.brand !== "all") query = query.eq("make", filters.brand);
    const locationParam = searchParams.get("location");
    if (locationParam) query = query.ilike("yard_location", `%${locationParam}%`);
    if (filters.year !== "all") query = query.eq("year", parseInt(filters.year));
    if (filters.availability !== "all") query = query.eq("status", filters.availability);
    if (filters.fuelType !== "all") query = query.eq("fuel_type", filters.fuelType);
    if (filters.priceRange !== "all") {
      const [min, max] = filters.priceRange.split("-").map(Number);
      if (max) query = query.gte("price", min).lte("price", max);
      else query = query.gte("price", min);
    }
    if (stockFilter === "in-stock") query = query.neq("status", "sold");
    else if (stockFilter === "sold-out") query = query.eq("status", "sold");
    return query;
  };

  const { data: carsData, isLoading } = useQuery({
    queryKey: ['cars', searchQuery, filters, stockFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      const { data, error, count } = await buildCarsQuery().range(from, to).order("created_at", { ascending: false });
      if (error) throw error;
      return { cars: data || [], total: count || 0 };
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });

  const cars = carsData?.cars || [];
  const totalPages = Math.ceil((carsData?.total || 0) / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filters, stockFilter]);

  const toggleWishlist = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (wishlist.includes(carId)) {
        if (user) await supabase.from("wishlist").delete().eq("user_id", user.id).eq("car_id", carId);
        else {
          const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
          localStorage.setItem("wishlist", JSON.stringify(local.filter((id: string) => id !== carId)));
        }
        setWishlist(wishlist.filter(id => id !== carId));
        toast({ title: "Removed from whitelist" });
      } else {
        if (user) await supabase.from("wishlist").insert({ user_id: user.id, car_id: carId });
        else {
          const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
          localStorage.setItem("wishlist", JSON.stringify([...local, carId]));
        }
        setWishlist([...wishlist, carId]);
        toast({ title: "Added to whitelist" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ brand: "all", year: "all", availability: "all", fuelType: "all", priceRange: "all" });
    setStockFilter("all");
    setCurrentPage(1);
  };

  const getImages = (car: any): string[] => {
    if (car.main_images) {
      const parsed = typeof car.main_images === 'string' ? JSON.parse(car.main_images) : car.main_images;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    if (car.images) {
      const parsed = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    return [];
  };

  const { data: filterOptions } = useQuery({
    queryKey: ['car-filter-options'],
    queryFn: async () => {
      const { data } = await supabase.from("cars").select("year, make, fuel_type");
      const uniqueYears = Array.from(new Set(data?.map((car) => car.year) || [])).filter(Boolean).sort((a, b) => b - a);
      const uniqueMakes = Array.from(new Set(data?.map((car) => car.make).filter(make => make && make.trim() !== '') || [])).sort();
      const uniqueFuelTypes = Array.from(new Set(data?.map((car) => car.fuel_type).filter(type => type && type.trim() !== '') || [])).sort();
      return { uniqueYears, uniqueMakes, uniqueFuelTypes };
    },
    staleTime: 10 * 60 * 1000,
  });

  const uniqueYears = filterOptions?.uniqueYears || [];
  const uniqueMakes = filterOptions?.uniqueMakes || [];
  const uniqueFuelTypes = filterOptions?.uniqueFuelTypes || [];

  if (isLoading && !carsData) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20 text-slate-900">
      {/* Background Overlays - Subtle & Official */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,210,255,0.15),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee - Institutional Branding */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                NTSA Verification
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Direct Logistics
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Trophy className="h-3 w-3 text-brand-red" />
                Asset Scaling
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Unit Validation
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-professional {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-professional {
          animation: marquee-professional 40s linear infinite;
        }
        @keyframes car-move-large {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-car-move-large {
          animation: car-move-large 3s infinite ease-in-out;
        }
        @keyframes image-flash {
          0% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.9; filter: brightness(1.5); }
          100% { opacity: 1; filter: brightness(1); }
        }
        .group:hover .animate-flash {
          animation: image-flash 0.6s ease-in-out;
        }
        .glass-clear {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        @keyframes hazard-border-move {
          0% { background-position: 0 0; }
          100% { background-position: 32px 32px; }
        }
        .animate-hazard-border {
          animation: hazard-border-move 1s linear infinite;
        }
      `}</style>

      {/* Catalogue Hero - Full Fidelity Responsive Institutional Terminal */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[400px] overflow-hidden bg-slate-900 border-b border-slate-200">
        <div className="absolute inset-0 z-0">
          <img
            src="/catalogue.png"
            alt="Justice Ultimate Automobiles Ledger"
            className="w-full h-full object-cover object-center"
          />
          {/* Institutional Overlay - Balances visibility and readability */}
          <div className="absolute inset-0 bg-black/30 z-10" />
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-full max-w-[1400px] space-y-4 md:space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-1000">
            <div className="flex justify-center mb-2">
               <Car className="h-8 w-8 sm:h-10 sm:w-10 text-brand-red animate-car-move-large drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl text-white font-mono text-[8px] sm:text-[10px] font-black tracking-[0.3em] uppercase mx-auto">
               <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
               Our Full Stock: 2026
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white uppercase drop-shadow-[0_8px_20px_rgba(0,0,0,1)] leading-tight">
              Car <span className="text-brand-red">Catalogue.</span>
            </h1>

            <p className="text-[9px] sm:text-[12px] md:text-[14px] lg:text-[16px] text-white/90 font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-[0.2em] drop-shadow-[0_4px_12px_rgba(0,0,0,1)] px-4">
              Browse our high-quality Japanese and European cars. <br className="hidden sm:block" />
              Every car is fully inspected and verified before being listed.
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bike-move {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-bike-move {
          animation: bike-move 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* Asset Filtering Hub - Opaque & Professional */}
      <section className="relative z-20 -mt-6 sm:-mt-8">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="max-w-6xl mx-auto relative group">
            {/* Hazard Pattern Border - Background layer */}
            <div className="absolute -inset-[1px] sm:-inset-[2px] rounded-xl sm:rounded-2xl overflow-hidden animate-hazard-border opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                 style={{
                   backgroundImage: 'repeating-linear-gradient(-45deg, #ef4444, #ef4444 8px, #fbbf24 8px, #fbbf24 16px)'
                 }}
            />

            {/* Inner Content - Solid background to mask the hazard pattern center */}
            <div className="relative bg-white dark:bg-slate-900 border border-transparent p-3 sm:p-4 shadow-2xl flex flex-col gap-3 sm:gap-4 rounded-lg sm:rounded-xl backdrop-blur-md m-[1px]">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-brand-red" />
                <Input
                  placeholder="Search by car model, year, or color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 sm:h-12 pl-10 sm:pl-12 rounded-lg bg-slate-50 border-slate-200 focus:border-brand-red/50 focus:ring-brand-red/20 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-slate-900"
                />
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {["all", "in-stock", "sold-out"].map((s) => (
                  <Button
                    key={s}
                    variant={stockFilter === s ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStockFilter(s)}
                    className={`rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-4 sm:px-6 h-8 sm:h-10 whitespace-nowrap ${stockFilter === s ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-white"}`}
                  >
                    {s === 'all' ? 'All' : s === 'in-stock' ? 'In Stock' : 'Sold'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {[
                { key: 'brand', label: 'Brand', options: uniqueMakes },
                { key: 'year', label: 'Year', options: uniqueYears },
                { key: 'fuelType', label: 'Fuel Type', options: uniqueFuelTypes },
                { key: 'priceRange', label: 'Price Range', options: ['Under 1M', '1M - 3M', '3M - 5M', '5M - 10M', '10M+'] }
              ].map((f) => (
                <Select key={f.key} value={(filters as any)[f.key]} onValueChange={(val) => setFilters({ ...filters, [f.key]: val })}>
                  <SelectTrigger className="h-10 sm:h-12 rounded-lg bg-slate-50 border-slate-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-700">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white">
                    <SelectItem value="all" className="text-[10px] sm:text-[11px] font-bold uppercase">All {f.label}s</SelectItem>
                    {f.options.map((opt: any) => (
                      <SelectItem key={opt} value={opt.toString().includes('M') ? opt.toString().replace(/ /g, '').toLowerCase() : opt.toString()} className="text-[10px] sm:text-[11px] font-bold uppercase">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>

            <div className="flex justify-between items-center px-1 sm:px-2 border-t border-slate-100 pt-2 sm:pt-3">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Found: {carsData?.total || 0}</p>
              <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-red hover:no-underline hover:text-slate-900 transition-colors">Reset</Button>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Asset Ledger Grid */}
      <section className="py-12 sm:py-24 relative z-10">
        <div className="container max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-10 border-b border-slate-100 pb-4 sm:pb-6">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight">In Stock</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black">
              {carsData?.total || 0}
            </span>
          </div>

          {cars.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 sm:p-24 text-center max-w-4xl mx-auto shadow-2xl">
              <Car className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-6 sm:mb-8 text-brand-red opacity-20" />
              <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase mb-2 sm:mb-4 text-slate-900">Query Buffer Empty</h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8 sm:mb-10 max-w-md mx-auto">
                No verified units match your criteria.
              </p>
              <Button onClick={clearFilters} className="bg-slate-900 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] px-8 sm:px-12 h-12 sm:h-14 rounded-xl shadow-xl hover:bg-brand-red transition-all duration-500">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    isWhitelisted={wishlist.includes(car.id)}
                    onToggleWishlist={toggleWishlist}
                    onQuickView={(e, c) => { setSelectedQuickCar(c); setQuickViewOpen(true); }}
                    onZoom={(imgs, t) => setFullscreen({ images: imgs, title: t })}
                  />
                ))}
              </div>

              {carsData?.total && carsData.total > cars.length ? (
                <div className="mt-16 text-center">
                   <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                      Displaying {cars.length} of {carsData.total} Institutional Units
                   </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* Formal Business Leads */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center text-center space-y-6 shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all group">
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                 <CreditCard className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Institutional Financing</h4>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-sm leading-relaxed">Aggressive 90% capital backing via tier-1 partners. 48h dispatch audit cycle.</p>
              </div>
              <Button size="lg" className="px-12 h-14 rounded-xl bg-slate-900 hover:bg-brand-red text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500" onClick={() => navigate("/asset-finance")}>
                Initialize Finance Application
              </Button>
           </div>
           <div className="bg-white border border-slate-200 p-10 rounded-2xl flex flex-col items-center text-center space-y-6 shadow-lg hover:shadow-2xl hover:border-brand-red/30 transition-all group">
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-brand-red group-hover:text-white transition-all duration-500 shadow-inner">
                 <Headphones className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Technical Support Hub</h4>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-sm leading-relaxed">Direct line to technical yard dispatch. Mean response latency: 12 minutes.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Button size="lg" variant="outline" className="px-12 h-14 rounded-xl border-slate-200 text-slate-900 font-black text-[11px] uppercase tracking-[0.3em] group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 flex-1 sm:flex-none shadow-md" onClick={() => navigate("/contact")}>
                  Establish Contact
                </Button>
                <Button size="lg" variant="outline" className="px-12 h-14 rounded-xl border-slate-200 text-slate-900 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 flex-1 sm:flex-none shadow-md" onClick={() => window.open("https://maps.app.goo.gl/7x51yn7VHwHfpEpV8")}>
                  <MapPin className="h-4 w-4 mr-2" />
                  View Strategic Hub
                </Button>
              </div>
           </div>
        </div>
      </section>

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        car={selectedQuickCar}
      />

      <FullscreenImageViewer
        open={!!fullscreen}
        onOpenChange={(o) => !o && setFullscreen(null)}
        images={fullscreen?.images || []}
        title={fullscreen?.title}
      />
    </div>
  );
};

export default Catalogue;
