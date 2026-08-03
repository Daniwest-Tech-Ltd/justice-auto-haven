import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Phone, Mail, MessageCircle, Car, Gauge, Settings as SettingsIcon, Heart, Shield, MapPin, Clock, CreditCard, Fuel, Navigation, ChevronRight, Star, Activity, Zap, Globe, Headphones, Maximize2, ShieldCheck, Trophy, Bike, Key } from "lucide-react";
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
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
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
      `}</style>

      {/* Catalogue Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <div className="flex justify-center mb-2">
               <Car className="h-8 w-8 text-brand-red animate-car-move-large" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Asset Ledger: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Automotive <span className="text-brand-red">Catalogue.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Browse our institutional collection of verified Japanese and European automotive assets. <br className="hidden md:block" /> Every unit is subjected to a rigorous 150-point mechanical and legal audit before listing.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/asset-finance")}>
                Financing Deck
              </Button>
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/trade-in")}>
                Trade-In Portal
              </Button>
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider gap-2 group" onClick={() => navigate("/motorbikes")}>
                Motorcycle
                <Bike className="h-4 w-4 text-brand-red animate-bike-move" />
              </Button>
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider gap-2" onClick={() => navigate("/rentals")}>
                Rent Now
                <Key className="h-3.5 w-3.5 text-brand-red" />
              </Button>
            </div>
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
      <section className="relative z-20 -mt-6">
        <div className="container mx-auto px-4">
          <div className="bg-background border border-border p-3 shadow-lg flex flex-col gap-3 rounded-lg max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Asset Search: VIN, Make, Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10 rounded-md border-input focus:ring-1 focus:ring-brand-red/50 text-[11px] font-bold uppercase tracking-tight"
                />
              </div>
              <div className="flex gap-1 border border-border p-1 rounded-md">
                {["all", "in-stock", "sold-out"].map((s) => (
                  <Button
                    key={s}
                    variant={stockFilter === s ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStockFilter(s)}
                    className={`rounded-sm text-[9px] font-bold uppercase tracking-widest px-4 h-8 ${stockFilter === s ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"}`}
                  >
                    {s.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'brand', label: 'Manufacturer', options: uniqueMakes },
                { key: 'year', label: 'Model Year', options: uniqueYears },
                { key: 'fuelType', label: 'Propulsion', options: uniqueFuelTypes },
                { key: 'priceRange', label: 'Capital Class', options: ['Under 1M', '1M - 3M', '3M - 5M', '5M - 10M', '10M+'] }
              ].map((f) => (
                <Select key={f.key} value={(filters as any)[f.key]} onValueChange={(val) => setFilters({ ...filters, [f.key]: val })}>
                  <SelectTrigger className="h-10 rounded-md bg-secondary/20 border-border text-[10px] font-bold uppercase tracking-wider">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent className="border-border">
                    <SelectItem value="all" className="text-[11px] font-bold uppercase">All {f.label}s</SelectItem>
                    {f.options.map((opt: any) => (
                      <SelectItem key={opt} value={opt.toString().includes('M') ? opt.toString().replace(/ /g, '').toLowerCase() : opt.toString()} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>

            <div className="flex justify-between items-center px-1 border-t border-border pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {carsData?.total || 0} Professional Assets</p>
              <Button variant="link" size="sm" onClick={clearFilters} className="h-auto p-0 text-[10px] font-bold uppercase tracking-widest text-brand-red hover:no-underline">Purge Filters</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Ledger Grid */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          {cars.length === 0 ? (
            <div className="bg-secondary/5 border border-dashed border-border rounded-xl p-20 text-center max-w-4xl mx-auto">
              <Car className="h-10 w-10 mx-auto mb-6 text-brand-red opacity-30" />
              <h3 className="text-xl font-bold tracking-tight uppercase mb-4 text-foreground">Query Buffer Empty</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mb-8 max-w-md mx-auto">
                No verified units currently match your selection criteria. <br /> Our logistics team can facilitate a direct procurement from Japan for your specific configuration.
              </p>
              <Button onClick={clearFilters} className="bg-primary font-bold text-[10px] uppercase tracking-widest px-8 h-10 rounded-md">
                Reset Audit Hub
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                {cars.map((car) => {
                  const images = getImages(car);
                  const isWhitelisted = wishlist.includes(car.id);
                  return (
                    <div
                      key={car.id}
                      className="group relative bg-background border border-border hover:border-brand-red/40 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-xl rounded-lg overflow-hidden"
                    >
                      <div className="aspect-[4/3] overflow-hidden relative border-b border-border" onClick={() => navigate(`/car/${car.id}`)}>
                        <img src={images[0] || "/placeholder.svg"} alt={car.model} className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          <Badge className="bg-primary text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider">
                             #{car.stock_id || 'UNIT'}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                           <Badge className={`text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider border-none ${car.status === 'sold' ? 'bg-red-600' : 'bg-green-600'}`}>
                              {car.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
                           </Badge>
                           {car.status === 'available' && car.units_available && car.units_available > 1 && (
                             <Badge className="bg-emerald-600 text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider border-none shadow-md">
                                ({car.units_available}) UNITS
                             </Badge>
                           )}
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                           <Button size="icon" variant="secondary" className="h-7 w-7 rounded-md bg-white/90 text-black hover:bg-brand-red hover:text-white border-none shadow-md"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreen({ images: images.length ? images : ["/placeholder.svg"], title: `${car.make} ${car.model}` }); }}
                           >
                              <Maximize2 className="h-3.5 w-3.5" />
                           </Button>
                           <Button size="icon" variant="secondary" className={`h-7 w-7 rounded-md border-none shadow-md transition-all ${isWhitelisted ? "bg-brand-red text-white" : "bg-white/90 text-black hover:bg-brand-red hover:text-white"}`}
                              onClick={(e) => toggleWishlist(e, car.id)}
                           >
                              <Heart className={`h-3.5 w-3.5 ${isWhitelisted ? "fill-white" : ""}`} />
                           </Button>
                        </div>
                      </div>

                      <div className="p-3 space-y-3 flex-1 flex flex-col justify-between" onClick={() => navigate(`/car/${car.id}`)}>
                        <div className="space-y-1">
                          <h3 className="text-[11px] font-extrabold uppercase tracking-tight truncate text-foreground/90 group-hover:text-brand-red transition-colors">{car.make} {car.model}</h3>
                          <div className="flex justify-between items-center border-b border-border/50 pb-1.5 mb-1.5">
                            <p className="text-sm font-black text-foreground tracking-tighter">KSh {car.price?.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{car.year}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="h-3 w-3 text-primary" />
                            <p className="text-[9px] font-bold text-muted-foreground uppercase truncate">{car.mileage || '0 KM'}</p>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <SettingsIcon className="h-3 w-3 text-primary" />
                            <p className="text-[9px] font-bold text-muted-foreground uppercase truncate">{car.transmission || 'MT'}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 mt-auto">
                          <div className="flex items-center justify-between text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                            <span className="flex items-center gap-1"><Fuel className="h-2.5 w-2.5" /> {car.fuel_type || 'PET'}</span>
                            <span className="text-brand-red">Details <ChevronRight className="h-2 w-2 inline" /></span>
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
        <div className="grid md:grid-cols-2 gap-4">
           <div className="bg-background border border-border p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm hover:border-primary/30 transition-all group">
              <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                 <CreditCard className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-extrabold uppercase tracking-tight">Institutional Financing</h4>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-sm">Aggressive 90% capital backing via tier-1 partners. 48h dispatch audit cycle.</p>
              </div>
              <Button size="sm" className="px-10 h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-widest" onClick={() => navigate("/asset-finance")}>
                Initialize Finance Application
              </Button>
           </div>
           <div className="bg-background border border-border p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm hover:border-brand-red/30 transition-all group">
              <div className="h-12 w-12 rounded-full bg-brand-red/5 flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all duration-300">
                 <Headphones className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-extrabold uppercase tracking-tight">Technical Support Hub</h4>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-sm">Direct line to technical yard dispatch. Mean response latency: 12 minutes.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                <Button size="sm" variant="outline" className="px-10 h-10 rounded-md border-border text-foreground font-bold text-[10px] uppercase tracking-widest group-hover:bg-brand-red group-hover:text-white group-hover:border-brand-red flex-1 sm:flex-none" onClick={() => navigate("/contact")}>
                  Establish Direct Contact
                </Button>
                <Button size="sm" variant="outline" className="px-10 h-10 rounded-md border-border text-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white flex-1 sm:flex-none" onClick={() => window.open("https://maps.app.goo.gl/7x51yn7VHwHfpEpV8")}>
                  <MapPin className="h-3 w-3 mr-2" />
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
