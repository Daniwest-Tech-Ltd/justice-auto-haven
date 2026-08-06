import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Car, Globe, Zap, Users, Search,
  CheckCircle, Heart, ArrowRight,
  Clock, DollarSign, Settings, Phone, Gauge, Mail,
  Activity, ShieldCheck, Briefcase, Flame, MapPin,
  Navigation, Calendar, ChevronRight, Headphones, Star,
  Trophy, Shield,
  ArrowUpRight, CreditCard, RefreshCw, Eye, Maximize2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentSale } from "@/lib/currentSale";
import specialOffer from "@/assets/special-offer.png";
import QuickViewModal from "@/components/QuickViewModal";
import { LiveViewers, StockUrgency } from "@/components/SocialProof";
import { useAuth } from "@/hooks/useAuth";
import { CarCard } from "@/components/CarCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Home = () => {
  const sale = getCurrentSale();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [promo1Flipped, setPromo1Flipped] = useState(false);
  const [promo2Flipped, setPromo2Flipped] = useState(false);

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAllData();
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    if (user) {
      const { data } = await supabase.from("wishlist").select("car_id").eq("user_id", user.id);
      setWishlist(data?.map(w => w.car_id) || []);
    } else {
      setWishlist(JSON.parse(localStorage.getItem("wishlist") || "[]"));
    }
  };

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

  const openQuickView = (e: React.MouseEvent, car: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCar(car);
    setQuickViewOpen(true);
  };

  const fetchAllData = async () => {
    const { data: featuredData } = await supabase
      .from("cars")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(12);
    if (featuredData) setFeaturedCars(featuredData);

    const { data: brandsData } = await supabase
      .from("brands")
      .select("*")
      .order("name");
    if (brandsData) setBrands(brandsData);
  };

  const handleSearch = () => {
    if (searchQuery.trim() || selectedBrand) {
      navigate(`/catalogue?search=${searchQuery}&brand=${selectedBrand}`);
    } else {
      toast({
        title: "Search Required",
        description: "Please enter a search term or select a brand",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-red selection:text-white overflow-x-hidden font-sans antialiased text-slate-900">
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
      `}</style>

      {/* Hero Showcase - Compact Institutional Terminal */}
      <section className="relative w-full h-[70vh] min-h-[500px] bg-slate-900 overflow-hidden">
        {/* Background Image - Scale to Fill while remaining fully visible */}
        <div className="absolute inset-0 z-0">
          <img
            src="/home im.png"
            alt="Justice Ultimate Automobiles Terminal"
            className="w-full h-full object-cover object-center"
          />
          {/* Institutional Overlay - Balances visibility and readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />
        </div>

        {/* Content Overlay - Centered Terminal Interface */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-[1400px] space-y-4 md:space-y-10 animate-in slide-in-from-bottom-12 fade-in duration-1000">

            {/* Status Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl text-white font-mono text-[9px] md:text-[11px] font-black tracking-[0.4em] uppercase shadow-2xl">
                <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-brand-red animate-pulse shadow-[0_0_10px_#ef4444]" />
                Your Trusted Car Dealer
              </div>
            </div>

            {/* Main Branding - Official Style Single Line Typography */}
            <div className="space-y-3 md:space-y-6 text-center">
              <h1 className="text-[4vw] min-text-[20px] sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white uppercase drop-shadow-[0_8px_24px_rgba(0,0,0,1)] leading-tight">
                <span className="inline-block">Africa's Premier Japanese and</span>
                <span className="text-brand-red inline-block md:ml-3">European Car Importers.</span>
              </h1>
              <p className="text-[10px] sm:text-[14px] md:text-[18px] lg:text-[20px] text-white font-medium max-w-4xl mx-auto leading-relaxed uppercase tracking-[0.25em] drop-shadow-[0_4px_12px_rgba(0,0,0,1)] px-4">
                We sell high quality cars and offer easy car loans with fast delivery across Kenya.
              </p>
            </div>

            {/* Rapid Conversion Hub */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 pt-6 sm:pt-10">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl px-12 sm:px-20 h-14 sm:h-20 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] sm:text-[13px] uppercase tracking-[0.3em] transition-all shadow-xl border-none active:scale-95"
                onClick={() => navigate("/catalogue")}
              >
                Enter Catalogue
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl px-12 sm:px-20 h-14 sm:h-20 border-white/40 bg-white/10 backdrop-blur-xl hover:bg-white hover:text-slate-900 text-white font-black text-[11px] sm:text-[13px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
                onClick={() => navigate("/asset-finance")}
              >
                Finance Portal
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle Indicator for Scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce hidden md:block">
           <div className="w-1 h-10 rounded-full bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </section>

      {/* Asset Search Module */}
      <section className="relative z-30 -mt-10 sm:-mt-12">
        <div className="container mx-auto px-4">
          <div className="bg-white border border-slate-200 p-4 shadow-xl flex flex-col md:flex-row gap-4 items-stretch rounded-xl backdrop-blur-sm">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-red" />
              <Input
                placeholder="Search for a car (e.g. Toyota, Nissan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 rounded-lg bg-slate-50 border-slate-200 focus:border-brand-red/50 focus:ring-brand-red/20 transition-all text-[12px] font-bold uppercase tracking-widest text-slate-900"
              />
            </div>

            <div className="w-full md:w-72">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-14 rounded-lg bg-slate-50 border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-700">
                  <SelectValue placeholder="Search by Brand" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name} className="text-[11px] uppercase font-black">{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSearch} size="lg" className="h-14 px-12 rounded-lg bg-slate-900 hover:bg-brand-red transition-all duration-300 text-[11px] font-black uppercase tracking-[0.3em] shadow-lg hover:shadow-brand-red/20 text-white">
              Search Now
            </Button>
          </div>
        </div>
      </section>

      {/* Current Assets - MICRO BUSINESS TILES */}
      {featuredCars.length > 0 && (
        <section className="py-24 bg-white" aria-label="Asset Inventory">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-red">Available Inventory</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">Our Latest Cars</h2>
              <div className="h-1.5 w-24 bg-brand-red mt-4 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {featuredCars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  isWhitelisted={wishlist.includes(car.id)}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={openQuickView}
                />
              ))}
            </div>

            <div className="mt-20 text-center">
               <Button variant="outline" className="border-slate-200 text-slate-900 font-black text-[11px] uppercase tracking-[0.4em] h-16 px-14 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-lg hover:shadow-xl" onClick={() => navigate("/catalogue")}>
                  View Our Cars <ArrowRight className="ml-3 h-5 w-5" />
               </Button>
            </div>
          </div>
        </section>
      )}

      {/* Institutional Profile Section - Story & Experience */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-red/20 blur-[120px]" />
           <div className="absolute bottom-0 left-0 w-1/2 h-full bg-primary/20 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <div className="space-y-8 animate-in slide-in-from-left duration-700">
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Establishment: 2020</p>
                   <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
                     The Justice Ultimate <br/> <span className="text-brand-red">Legacy.</span>
                   </h2>
                </div>
                <div className="space-y-6 text-slate-400 font-medium text-sm leading-loose uppercase tracking-wider text-justify">
                   <p>
                     Justice Ultimate Automobiles was started with a simple goal: to be the most trusted place to buy cars in Kenya. We believe that everyone deserves high-quality cars they can rely on.
                   </p>
                   <p>
                     Since 2020, we have helped over 5,000 customers get their dream cars. We ship cars directly from Japan to our yard in Westlands, Nairobi. Every car we sell goes through a thorough 150-point check to make sure it is in perfect condition.
                   </p>
                   <p>
                     Under the leadership of Justice Vincent, we have grown from a small business to a trusted partner for both companies and individuals looking for the best Japanese and European cars.
                   </p>
                </div>
                <div className="pt-6">
                   <Button onClick={() => navigate("/about")} variant="outline" className="h-16 px-12 rounded-xl border-white/20 text-white font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white hover:text-slate-900 transition-all">
                      Read Full Story
                   </Button>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 animate-in zoom-in duration-700">
                {[
                  { icon: Trophy, label: "Market Leaders", val: "5K+ Sales" },
                  { icon: ShieldCheck, label: "Quality Checked", val: "100% KEBS" },
                  { icon: Globe, label: "Global Reach", val: "Direct Japan" },
                  { icon: Users, label: "Customer Trust", val: "4.9/5 Rating" }
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-4 backdrop-blur-md">
                     <item.icon className="h-8 w-8 text-brand-red mx-auto" />
                     <p className="text-2xl font-black tracking-tighter">{item.val}</p>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Customer Trust Signals - Testimonials */}
      <section className="py-32 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
           <div className="text-center space-y-4 mb-24">
              <p className="text-[11px] font-black uppercase tracking-[0.8em] text-brand-red">Customer Feedback</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase italic">What Our Customers Say</h2>
              <div className="h-2 w-40 bg-brand-red mx-auto mt-6 rounded-full" />
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Captain Michael Davinson",
                  role: "Logistics Manager",
                  text: "The procurement process for our 12-unit fleet expansion was executed with surgical precision. Justice Ultimate's audit reports are the gold standard."
                },
                {
                  name: "Dr. Sarah Mwangi",
                  role: "Private Collector",
                  text: "Importing a classic Mercedes can be stressful, but Justice Vincent and his team handled every KEBS and KRA requirement. My car arrived in showroom condition."
                },
                {
                  name: "Samuel Dickson",
                  role: "Tech Entrepreneur",
                  text: "90% financing in 48 hours seemed impossible until I visited the Westlands Terminal. Professional, transparent, and ultra-fast delivery."
                }
              ].map((t, i) => (
                <Card key={i} className="bg-slate-50 border-slate-200 p-10 space-y-6 rounded-3xl relative hover:shadow-2xl transition-all duration-500 group">
                   <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-brand-red text-brand-red" />)}
                   </div>
                   <p className="text-sm font-medium leading-loose text-slate-600 italic">"{t.text}"</p>
                   <div className="pt-6 border-t border-slate-200">
                      <p className="font-black text-slate-900 uppercase tracking-widest text-[12px]">{t.name}</p>
                      <p className="text-[9px] font-bold text-brand-red uppercase tracking-[0.2em]">{t.role}</p>
                   </div>
                </Card>
              ))}
           </div>
        </div>
      </section>

      {/* Financial Sourcing - Institutional Style */}
      <section className="py-32 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <Badge className="bg-brand-red text-white px-5 py-1.5 text-[11px] font-black tracking-[0.3em] uppercase rounded-md border-none shadow-lg">
                   Easy Financing
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-slate-900 uppercase italic">
                  Car Loans & <br />
                  <span className="text-brand-red">Finance.</span>
                </h2>
                <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed max-w-lg font-bold border-l-4 border-brand-red pl-8 uppercase tracking-widest">
                  Get up to 90% car financing through our banking partners. Fast 48-hour approval for employees and business owners.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <Card className="bg-white border-slate-200 p-8 space-y-5 hover:border-brand-red/30 transition-all group rounded-xl shadow-md hover:shadow-xl">
                  <div className="h-14 w-14 bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-brand-red group-hover:border-brand-red transition-all duration-500 rounded-lg">
                    <Users className="h-7 w-7 text-slate-900 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-900 mb-2">For Employees</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">Get up to 90% financing with just your last 3 months' payslips.</p>
                  </div>
                </Card>
                <Card className="bg-white border-slate-200 p-8 space-y-5 hover:border-brand-red/30 transition-all group rounded-xl shadow-md hover:shadow-xl">
                  <div className="h-14 w-14 bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-brand-red group-hover:border-brand-red transition-all duration-500 rounded-lg">
                    <Briefcase className="h-7 w-7 text-slate-900 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-900 mb-2">For Businesses</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">Expand your fleet with flexible payment plans for your business.</p>
                  </div>
                </Card>
              </div>

              <Button className="rounded-xl px-16 h-18 bg-slate-900 hover:bg-brand-red text-white font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all duration-500" onClick={() => navigate("/asset-finance")}>
                Apply for Financing
              </Button>
            </div>

            <div className="relative group">
              <Card className="border-border p-3 rounded-md overflow-hidden bg-background">
                 <div className="aspect-[4/3] relative overflow-hidden bg-primary/20">
                    <img src={specialOffer} alt="Financial Showcase" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-black/60">
                       <p className="text-[10px] font-black tracking-[0.6em] text-brand-red uppercase mb-4 animate-pulse">Special Offer</p>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Low Interest Rates</h3>
                       <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest mb-10 max-w-xs leading-relaxed">Enjoy the best interest rates for 2026. Available for select cars.</p>
                       <Button size="lg" className="bg-brand-red hover:bg-brand-red/80 rounded-sm px-12 h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
                          Get More Info
                       </Button>
                    </div>
                 </div>
              </Card>
              <div className="absolute -bottom-6 -right-6 h-32 w-32 border-r-4 border-b-4 border-brand-red/20 pointer-events-none" />
              <div className="absolute -top-6 -left-6 h-32 w-32 border-l-4 border-t-4 border-brand-red/20 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Executive Feature Grid */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Promo 1: Finance Focus */}
            <div
              className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl cursor-pointer"
              onMouseEnter={() => setPromo1Flipped(!promo1Flipped)}
              onClick={() => navigate("/asset-finance")}
            >
              <div className="absolute inset-0 z-0 bg-slate-50">
                 <img
                   src={promo1Flipped ? "/home/thome.png" : "/home/fhome.png"}
                   alt="Car Financing"
                   className="w-full h-full object-contain transition-all duration-700 ease-in-out animate-flash"
                 />
                 <div className="absolute inset-0 glass-clear opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors duration-500" />
              </div>

              {/* Dynamic Message */}
              <div className="absolute inset-0 z-20 flex items-center justify-start pointer-events-none pl-12">
                 <div className="bg-brand-red text-white px-8 py-4 transform -translate-x-[120%] group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl border-l-8 border-slate-900">
                    <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter whitespace-nowrap overflow-hidden">
                       We offer 90% car financing
                    </p>
                 </div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-end p-10 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/20 border border-brand-red/30 text-[10px] font-black uppercase tracking-widest text-brand-red backdrop-blur-md w-fit">
                  <CreditCard className="h-4 w-4" />
                  Car Financing
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">
                  Easy <span className="text-brand-red">Funding.</span>
                </h3>
              </div>

              {/* Animated Corner Brackets */}
              <div className="absolute top-8 right-8 h-12 w-12 border-t-4 border-r-4 border-slate-200 group-hover:border-brand-red transition-all duration-500" />
              <div className="absolute bottom-8 left-8 h-12 w-12 border-b-4 border-l-4 border-slate-200 group-hover:border-brand-red transition-all duration-500" />
            </div>

            {/* Promo 2: Trade-In Focus */}
            <div
              className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-2xl cursor-pointer"
              onMouseEnter={() => setPromo2Flipped(!promo2Flipped)}
              onClick={() => navigate("/trade-in")}
            >
              <div className="absolute inset-0 z-0 bg-slate-50">
                 <img
                   src={promo2Flipped ? "/home/fhome.png" : "/home/thome.png"}
                   alt="Car Trade-In"
                   className="w-full h-full object-contain transition-all duration-700 ease-in-out animate-flash"
                 />
                 <div className="absolute inset-0 glass-clear opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors duration-500" />
              </div>

              {/* Dynamic Message */}
              <div className="absolute inset-0 z-20 flex items-center justify-start pointer-events-none pl-12">
                 <div className="bg-slate-900 text-white px-8 py-4 transform -translate-x-[120%] group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl border-l-8 border-brand-red">
                    <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter whitespace-nowrap overflow-hidden">
                       Exchange Your Car Today
                    </p>
                 </div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-end p-10 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 backdrop-blur-md w-fit">
                  <RefreshCw className="h-4 w-4" />
                  Car Trade-In
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">
                  Seamless <span className="text-brand-red">Exchange.</span>
                </h3>
              </div>

              {/* Animated Corner Brackets */}
              <div className="absolute top-8 right-8 h-12 w-12 border-t-4 border-r-4 border-slate-200 group-hover:border-slate-900 transition-all duration-500" />
              <div className="absolute bottom-8 left-8 h-12 w-12 border-b-4 border-l-4 border-slate-200 group-hover:border-slate-900 transition-all duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - AUTHORITY & TRUST */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-20">
             <p className="text-[11px] font-black uppercase tracking-[0.8em] text-brand-red">Why Buy From Us</p>
             <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">Why Choose <br/> <span className="text-brand-red">Justice Ultimate.</span></h2>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-loose">The best quality and reliability for your car purchase.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
             <div className="space-y-6 bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-md">
                <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-brand-red shadow-[0_0_10px_#ef4444]" />
                   We Pick the Best Cars
                </h3>
                <p className="text-sm text-slate-400 leading-loose font-medium text-justify">
                   We are not just another car dealer. We carefully select every car in our stock. We only buy cars with high auction ratings from Japan, ensuring your car is in great shape and worth every cent.
                </p>
             </div>
             <div className="space-y-6 bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-md">
                <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-brand-red shadow-[0_0_10px_#ef4444]" />
                   Easy Car Loans
                </h3>
                <p className="text-sm text-slate-400 leading-loose font-medium text-justify">
                   We work with top banks in Kenya to help you get the car you want. You can get up to 90% financing, meaning you don't have to spend all your cash at once. Our process is fast, simple, and built for you.
                </p>
             </div>
             <div className="space-y-6 bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-md">
                <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-brand-red shadow-[0_0_10px_#ef4444]" />
                   Safe and Fast Delivery
                </h3>
                <p className="text-sm text-slate-400 leading-loose font-medium text-justify">
                   We take care of everything from shipping the car from Japan to delivering it to your doorstep. We handle all government inspections, taxes, and logbook paperwork, so you can enjoy your new car without any stress.
                </p>
             </div>
             <div className="space-y-6 bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-md">
                <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-brand-red shadow-[0_0_10px_#ef4444]" />
                   24/7 Support for You
                </h3>
                <p className="text-sm text-slate-400 leading-loose font-medium text-justify">
                   We are here to help you even after you buy your car. Our support team in Nairobi is always ready to answer your questions. We respond in less than 15 minutes to make sure you are always taken care of.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Terminal Location - Physical Authority */}
      <section className="py-32 bg-slate-50 border-t border-slate-200">
         <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Visit Us</p>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Visit Our <br/> <span className="text-brand-red">Westlands Yard.</span></h2>
                  </div>
                  <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                       <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          <MapPin className="h-6 w-6 text-brand-red" />
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Physical Address</h4>
                          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mt-1 leading-relaxed">
                            Muthithi Road, Mpesi Lane 11 <br/>
                            Westlands, Nairobi, Kenya
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-6 items-start">
                       <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          <Phone className="h-6 w-6 text-brand-red" />
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Direct Line</h4>
                          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mt-1 leading-relaxed">
                            Sales: +254 751 555 544 <br/>
                            Support: +254 722 827 458
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-6 items-start">
                       <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-6 w-6 text-brand-red" />
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Yard Status</h4>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-2">
                             <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             Open & Ready for Viewing
                          </p>
                       </div>
                    </div>
                  </div>
                  <div className="pt-4">
                     <Button onClick={() => window.open("https://maps.app.goo.gl/7x51yn7VHwHfpEpV8")} className="h-16 px-12 rounded-xl bg-slate-900 hover:bg-brand-red text-white font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl">
                        Open in Google Maps
                     </Button>
                  </div>
               </div>
               <div className="relative group">
                  <div className="absolute -inset-4 bg-brand-red/5 rounded-[40px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-200">
                     <img src="/home im.png" alt="Justice Ultimate Terminal Exterior" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-black/20" />
                     <div className="absolute bottom-6 left-6 right-6 p-6 glass-strong rounded-2xl border border-white/10 text-white backdrop-blur-xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">Live Feed: Terminal Westlands</p>
                        <p className="text-sm font-bold uppercase tracking-widest text-white/80">Authorized Inspection Zone</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FAQ - Questions & Answers */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
           <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Frequently Asked <span className="text-brand-red">Questions.</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Quick answers to help you out</p>
           </div>
           <div className="space-y-6">
              {[
                { q: "How long does it take to import a car?", a: "It usually takes about 4 to 6 weeks from the time we win the car at an auction in Japan until it is ready for you in Nairobi." },
                { q: "Is the 'Lipa Mdogo Mdogo' plan available for all cars?", a: "Yes, you can use our flexible payment plan for any car we have in stock." }
              ].map((faq, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-8 rounded-2xl space-y-3">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{faq.q}</h4>
                   <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase tracking-tight">{faq.a}</p>
                </div>
              ))}
           </div>
           <div className="mt-12 text-center">
              <Button onClick={() => navigate("/faqs")} variant="link" className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] underline underline-offset-8 decoration-2">
                 View All Questions
              </Button>
           </div>
        </div>
      </section>

      {/* How We Help You */}
      <section className="py-32 relative bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-24">
            <p className="text-[11px] font-black uppercase tracking-[0.8em] text-brand-red">How We Help You</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase italic">Expert Support</h2>
            <div className="h-2 w-40 bg-brand-red mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {[
              {
                icon: Headphones,
                title: "Expert Advice",
                desc: "Get professional advice on choosing the best car for your needs."
              },
              {
                icon: ShieldCheck,
                title: "Quality Check",
                desc: "We provide a 7-day mechanical guarantee on all delivered cars."
              },
              {
                icon: Clock,
                title: "Fast Delivery",
                desc: "Get your car delivered anywhere in Kenya within 48 to 72 hours."
              }
            ].map((item, i) => (
              <Card key={i} className="bg-slate-50 border-slate-200 p-12 hover:bg-white transition-all hover:border-brand-red/30 rounded-xl flex flex-col items-center text-center shadow-md hover:shadow-2xl group">
                <div className="h-20 w-20 bg-slate-100 border border-slate-200 flex items-center justify-center mb-10 rounded-xl group-hover:bg-brand-red transition-all duration-500 shadow-inner">
                  <item.icon className="h-10 w-10 text-slate-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm font-black tracking-[0.4em] uppercase text-slate-900 mb-8">{item.title}</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Business KPI Dashboard - High Speed Style */}
          <div className="mt-32 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border border-slate-200 bg-white p-0 overflow-hidden rounded-2xl max-w-7xl mx-auto shadow-2xl">
            {[
              { val: "5.2K", label: "Cars Sold" },
              { val: "4.9/5", label: "Happy Customers" },
              { val: "100%", label: "Verified Cars" },
              { val: "47", label: "Service Locations" }
            ].map((stat, i) => (
              <div key={i} className="text-center py-16 first:border-l-0 border-l border-slate-100 group hover:bg-slate-900 transition-all duration-700">
                <p className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-slate-900 mb-3 group-hover:text-white">{stat.val}</p>
                <p className="text-[11px] uppercase font-black text-slate-400 tracking-[0.5em] group-hover:text-white/60 transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Support Quick Link */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50 p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl">
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Professional <span className="text-brand-red">Support.</span></h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-md">
                Need assistance with your automotive inquiry? Our executive support desk is operational and ready to assist.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Button className="bg-slate-900 text-white h-14 px-10 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => navigate("/support")}>
                Get Support Now
              </Button>
              <Button variant="outline" className="border-slate-200 h-14 px-10 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => navigate("/help-center")}>
                Help Center
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Action Footer Call - Direct Business Lead */}
      <section className="py-24 bg-slate-900 relative border-t-4 border-brand-red">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center text-center lg:text-left gap-16">
          <div className="space-y-6">
             <p className="text-[12px] font-black uppercase tracking-[0.8em] text-brand-red drop-shadow-sm">Get in Touch</p>
             <h4 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none uppercase italic drop-shadow-lg">Contact <br /> <span className="text-white/40">Us Today.</span></h4>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto items-center lg:items-start">
             <Button size="lg" className="rounded-md h-20 px-20 bg-white text-primary hover:bg-brand-red hover:text-white font-black text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl border-none" onClick={() => navigate("/contact")}>
                <span>Talk to our Team</span>
             </Button>
             <div className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">
                <Activity className="h-3 w-3 animate-pulse text-brand-red" />
                Average response time: 12 minutes
             </div>
          </div>
        </div>
      </section>

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        car={selectedCar}
      />
    </div>
  );
};

export default Home;
