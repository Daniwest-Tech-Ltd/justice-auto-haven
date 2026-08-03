import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Phone, Mail, MessageCircle, Car, Gauge, Settings as SettingsIcon, Heart, Shield, MapPin, Clock, CreditCard, Fuel, Navigation, ChevronRight, Star, Activity, Zap, Globe, Headphones, Maximize2, ShieldCheck, Trophy, Bike, Key, ArrowUpRight } from "lucide-react";
import { PaymentMethodsModal } from "@/components/PaymentMethodsModal";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import HeroSlider from "@/components/HeroSlider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSale } from "@/lib/currentSale";
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from "@/lib/recentSearches";
import { X as XIcon, Clock as ClockIcon } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import useDisableRightClick from "@/hooks/useDisableRightClick";
import FullscreenImageViewer from "@/components/FullscreenImageViewer";

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
  const itemsPerPage = 64;
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches("catalogue"));
  const [showRecent, setShowRecent] = useState(false);
  const [fullscreen, setFullscreen] = useState<{ images: string[]; title: string } | null>(null);

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
    staleTime: 2 * 60 * 1000,
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

      {/* Catalogue Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-slate-200 py-16 sm:py-24 overflow-hidden bg-slate-900">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <div className="flex justify-center mb-2">
               <Car className="h-10 w-10 text-brand-red animate-car-move-large drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </div>
            <p className="text-[11px] font-black tracking-[0.4em] uppercase text-brand-red drop-shadow-sm">Operational Asset Ledger: {sale.year}</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic drop-shadow-lg leading-none">
              Automotive <span className="text-brand-red">Catalogue.</span>
            </h1>
            <p className="text-[10px] md:text-xs text-white font-black max-w-2xl mx-auto leading-loose uppercase tracking-[0.2em] drop-shadow-md pt-4">
              Browse our institutional collection of verified Japanese and European automotive assets. Every unit is subjected to a rigorous 150-point mechanical and legal audit before listing.
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
      <section className="relative z-20 -mt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto relative group">
            {/* Hazard Pattern Border - Background layer */}
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden animate-hazard-border opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                 style={{
                   backgroundImage: 'repeating-linear-gradient(-45deg, #ef4444, #ef4444 8px, #fbbf24 8px, #fbbf24 16px)'
                 }}
            />

            {/* Inner Content - Solid background to mask the hazard pattern center */}
            <div className="relative bg-white dark:bg-slate-900 border border-transparent p-4 shadow-2xl flex flex-col gap-4 rounded-xl backdrop-blur-md m-[1px]">
              <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-red" />
                <Input
                  placeholder="Asset Search: VIN, Make, Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 rounded-lg bg-slate-50 border-slate-200 focus:border-brand-red/50 focus:ring-brand-red/20 text-[12px] font-bold uppercase tracking-widest text-slate-900"
                />
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {["all", "in-stock", "sold-out"].map((s) => (
                  <Button
                    key={s}
                    variant={stockFilter === s ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStockFilter(s)}
                    className={`rounded-md text-[10px] font-black uppercase tracking-widest px-6 h-10 ${stockFilter === s ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-white"}`}
                  >
                    {s.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'brand', label: 'Manufacturer', options: uniqueMakes },
                { key: 'year', label: 'Model Year', options: uniqueYears },
                { key: 'fuelType', label: 'Propulsion', options: uniqueFuelTypes },
                { key: 'priceRange', label: 'Capital Class', options: ['Under 1M', '1M - 3M', '3M - 5M', '5M - 10M', '10M+'] }
              ].map((f) => (
                <Select key={f.key} value={(filters as any)[f.key]} onValueChange={(val) => setFilters({ ...filters, [f.key]: val })}>
                  <SelectTrigger className="h-12 rounded-lg bg-slate-50 border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-700">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white">
                    <SelectItem value="all" className="text-[11px] font-bold uppercase">All {f.label}s</SelectItem>
                    {f.options.map((opt: any) => (
                      <SelectItem key={opt} value={opt.toString().includes('M') ? opt.toString().replace(/ /g, '').toLowerCase() : opt.toString()} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>

            <div className="flex justify-between items-center px-2 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Operational Inventory: {carsData?.total || 0}</p>
              <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-brand-red hover:no-underline hover:text-slate-900 transition-colors">Reset Terminal</Button>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Asset Ledger Grid */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          {cars.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-24 text-center max-w-4xl mx-auto shadow-2xl">
              <Car className="h-12 w-12 mx-auto mb-8 text-brand-red opacity-20" />
              <h3 className="text-2xl font-black tracking-tighter uppercase mb-4 text-slate-900">Query Buffer Empty</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10 max-w-md mx-auto">
                No verified units currently match your selection criteria. Our logistics team can facilitate a direct procurement from Japan for your specific configuration.
              </p>
              <Button onClick={clearFilters} className="bg-slate-900 font-black text-[11px] uppercase tracking-[0.3em] px-12 h-14 rounded-xl shadow-xl hover:bg-brand-red transition-all duration-500">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
                {cars.map((car) => {
                  const images = getImages(car);
                  const isWhitelisted = wishlist.includes(car.id);
                  return (
                    <div
                      key={car.id}
                      className="group relative bg-white border border-slate-200 hover:border-brand-red/40 transition-all duration-500 cursor-pointer flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-xl border-b-4 hover:border-b-brand-red"
                    >
                      <div className="aspect-[4/3] overflow-hidden relative border-b border-slate-100" onClick={() => navigate(`/car/${car.id}`)}>
                        <img src={images[0] || "/placeholder.svg"} alt={car.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.95] group-hover:brightness-110 animate-flash" />
                        <div className="absolute inset-0 glass-clear opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity" />
                        
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                          <Badge className="bg-slate-900 text-white text-[8px] font-black uppercase rounded-md py-1 px-2 tracking-widest shadow-lg border-none">
                             #{car.stock_id || 'UNIT'}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                           <Badge className={`text-white text-[9px] font-black uppercase rounded-md py-1.5 px-3 tracking-widest border-none shadow-lg ${car.status === 'sold' ? 'bg-red-600' : 'bg-brand-red'}`}>
                              {car.status === 'sold' ? 'SOLD' : 'IN STOCK'}
                           </Badge>
                           {car.status === 'available' && car.units_available && car.units_available > 1 && (
                             <Badge className="bg-emerald-600 text-white text-[8px] font-black uppercase rounded-md py-1 px-2 border-none shadow-lg tracking-widest">
                                Available ({car.units_available})
                             </Badge>
                           )}
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                           <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl bg-white/90 text-slate-900 hover:bg-brand-red hover:text-white border-none shadow-xl"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreen({ images: images.length ? images : ["/placeholder.svg"], title: `${car.make} ${car.model}` }); }}
                           >
                              <Maximize2 className="h-4 w-4" />
                           </Button>
                           <Button size="icon" variant="secondary" className={`h-9 w-9 rounded-xl border-none shadow-xl transition-all ${isWhitelisted ? "bg-brand-red text-white" : "bg-white/90 text-slate-900 hover:bg-brand-red hover:text-white"}`}
                              onClick={(e) => toggleWishlist(e, car.id)}
                           >
                              <Heart className={`h-4 w-4 ${isWhitelisted ? "fill-white" : ""}`} />
                           </Button>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between" onClick={() => navigate(`/car/${car.id}`)}>
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                             <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover:text-brand-red transition-colors line-clamp-1">{car.make} {car.model}</h3>
                             <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-red group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                            <p className="text-lg font-black text-slate-900 tracking-tighter">KSh {car.price?.toLocaleString()}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{car.year}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-500 uppercase truncate">{car.mileage || '0 KM'}</p>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <SettingsIcon className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-500 uppercase truncate">{car.transmission || 'MT'}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-auto">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest">
                            <span className="flex items-center gap-2"><Fuel className="h-3 w-3" /> {car.fuel_type || 'PET'}</span>
                            <span className="text-brand-red group-hover:underline underline-offset-4">Details <ChevronRight className="h-3 w-3 inline" /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-16">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`text-[10px] font-bold uppercase tracking-widest ${currentPage === 1 ? "pointer-events-none opacity-20" : "cursor-pointer"}`}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className={`text-[11px] font-bold rounded-md h-9 w-9 transition-all ${currentPage === page ? "bg-primary text-white" : "border border-border hover:bg-secondary"}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`text-[10px] font-bold uppercase tracking-widest ${currentPage === totalPages ? "pointer-events-none opacity-20" : "cursor-pointer"}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
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
