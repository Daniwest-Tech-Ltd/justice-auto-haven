import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingScreen from "@/components/LoadingScreen";
import { Bike, Gauge, Fuel, Search, Cpu, Zap, ShieldCheck, Globe, Trophy, Shield, ShieldAlert, CheckCircle2, MapPin, Activity, Navigation, ChevronRight, Heart, Maximize2, Headphones, CreditCard, ArrowLeft } from "lucide-react";
import useDisableRightClick from "@/hooks/useDisableRightClick";
import HeroSlider from "@/components/HeroSlider";
import { getCurrentSale } from "@/lib/currentSale";
import FullscreenImageViewer from "@/components/FullscreenImageViewer";

interface Motorbike {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  engine_cc: number | null;
  transmission: string | null;
  fuel_type: string | null;
  color: string | null;
  mileage: string | null;
  condition: string | null;
  description: string | null;
  images: any;
  stock_id: string | null;
  status: string | null;
  is_featured: boolean | null;
  yard_location: string | null;
}

const MotorbikeCatalogue = () => {
  useDisableRightClick();
  const navigate = useNavigate();
  const sale = getCurrentSale();
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    brand: "all",
    condition: "all",
    engineSize: "all",
  });
  const [fullscreen, setFullscreen] = useState<{ images: string[]; title: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("motorbikes")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error) setBikes((data || []) as Motorbike[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bikes.filter((b) => {
      const matchesSearch = !q || [b.make, b.model, String(b.year), b.color, b.stock_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

      const matchesBrand = filters.brand === "all" || b.make.toLowerCase() === filters.brand.toLowerCase();
      const matchesCondition = filters.condition === "all" || (b.condition && b.condition.toLowerCase() === filters.condition.toLowerCase());

      let matchesEngine = true;
      if (filters.engineSize !== "all") {
        const cc = b.engine_cc || 0;
        if (filters.engineSize === "under-250") matchesEngine = cc < 250;
        else if (filters.engineSize === "250-600") matchesEngine = cc >= 250 && cc <= 600;
        else if (filters.engineSize === "600-1000") matchesEngine = cc > 600 && cc <= 1000;
        else if (filters.engineSize === "1000-plus") matchesEngine = cc > 1000;
      }

      return matchesSearch && matchesBrand && matchesCondition && matchesEngine;
    });
  }, [bikes, search, filters]);

  const uniqueBrands = useMemo(() =>
    Array.from(new Set(bikes.map(b => b.make))).sort()
  , [bikes]);

  if (loading) return <LoadingScreen />;

  const getImages = (b: Motorbike): string[] => {
    if (Array.isArray(b.images)) return b.images;
    if (typeof b.images === 'string') {
      try { return JSON.parse(b.images); } catch { return [b.images]; }
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Safety Audit Certified
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Global Fleet Sourcing
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Trophy className="h-3 w-3 text-brand-red" />
                Performance Verified
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Rider Protection Protocol
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
        @keyframes bike-move-large {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        .animate-bike-move-large {
          animation: bike-move-large 3s infinite ease-in-out;
        }
      `}</style>

      {/* Hero Header */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <div className="flex justify-center mb-2">
               <Bike className="h-8 w-8 text-brand-red animate-bike-move-large" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Two-Wheeled Asset Ledger: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              Motorbike <span className="text-brand-red">Catalogue.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
              Premium motorbike fleet — from high-performance sport units to adventure and corporate commuter solutions. Every unit undergoes a rigorous 120-point technical and safety audit.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/catalogue")}>
                Return to Cars
              </Button>
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/trade-in")}>
                Trade-In Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Filtering Hub */}
      <section className="relative z-20 -mt-6">
        <div className="container mx-auto px-4">
          <div className="bg-background border border-border p-3 shadow-lg flex flex-col gap-3 rounded-lg max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Asset Search: Make, Model, Stock ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10 rounded-md border-input focus:ring-1 focus:ring-brand-red/50 text-[11px] font-bold uppercase tracking-tight"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={filters.brand} onValueChange={(val) => setFilters({ ...filters, brand: val })}>
                <SelectTrigger className="h-10 rounded-md bg-secondary/20 border-border text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Manufacturer" />
                </SelectTrigger>
                <SelectContent className="border-border">
                  <SelectItem value="all" className="text-[11px] font-bold uppercase">All Manufacturers</SelectItem>
                  {uniqueBrands.map((b) => (
                    <SelectItem key={b} value={b} className="text-[11px] font-bold uppercase">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.condition} onValueChange={(val) => setFilters({ ...filters, condition: val })}>
                <SelectTrigger className="h-10 rounded-md bg-secondary/20 border-border text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent className="border-border">
                  <SelectItem value="all" className="text-[11px] font-bold uppercase">All Conditions</SelectItem>
                  <SelectItem value="new" className="text-[11px] font-bold uppercase">Zero Mileage (New)</SelectItem>
                  <SelectItem value="used" className="text-[11px] font-bold uppercase">Pre-Owned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.engineSize} onValueChange={(val) => setFilters({ ...filters, engineSize: val })}>
                <SelectTrigger className="h-10 rounded-md bg-secondary/20 border-border text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Engine Class" />
                </SelectTrigger>
                <SelectContent className="border-border">
                  <SelectItem value="all" className="text-[11px] font-bold uppercase">All Classes</SelectItem>
                  <SelectItem value="under-250" className="text-[11px] font-bold uppercase">Under 250cc (Commuter)</SelectItem>
                  <SelectItem value="250-600" className="text-[11px] font-bold uppercase">250cc - 600cc (Mid)</SelectItem>
                  <SelectItem value="600-1000" className="text-[11px] font-bold uppercase">600cc - 1000cc (Sport)</SelectItem>
                  <SelectItem value="1000-plus" className="text-[11px] font-bold uppercase">1000cc+ (Elite)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center px-1 border-t border-border pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing {filtered.length} Verified Units</p>
              <Button variant="link" size="sm" onClick={() => { setSearch(""); setFilters({ brand: "all", condition: "all", engineSize: "all" }); }} className="h-auto p-0 text-[10px] font-bold uppercase tracking-widest text-brand-red hover:no-underline">Purge Filters</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Quality Pledge */}
      <section className="container mx-auto px-4 pt-16 relative z-10">
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0 border border-brand-red/20">
            <ShieldAlert className="h-8 w-8 text-brand-red animate-pulse" />
          </div>
          <div className="space-y-2 text-center md:text-left flex-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center justify-center md:justify-start gap-2">
              Institutional Rider Safety Pledge
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed max-w-3xl">
              At Justice Ultimate Automobiles, we embrace the rider lifestyle. Every motorbike in our catalogue is subjected to a "Life-Safety Audit" covering braking systems, structural integrity, and electronic stabilization. We sell quality, because we value the lives of our riders.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Mechanical Audit</span>
             </div>
             <div className="flex flex-col items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Legal Clearance</span>
             </div>
             <div className="flex flex-col items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-[8px] font-black uppercase tracking-widest">Rider Ready</span>
             </div>
          </div>
        </div>
      </section>

      {/* Asset Ledger Grid */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="bg-secondary/5 border border-dashed border-border rounded-xl p-20 text-center max-w-4xl mx-auto">
              <Bike className="h-10 w-10 mx-auto mb-6 text-brand-red opacity-30" />
              <h3 className="text-xl font-bold tracking-tight uppercase mb-4 text-foreground">Query Buffer Empty</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mb-8 max-w-md mx-auto">
                No verified motorbikes currently match your selection criteria. <br /> Our logistics team can facilitate a direct procurement for your specific performance requirements.
              </p>
              <Button onClick={() => { setSearch(""); setFilters({ brand: "all", condition: "all", engineSize: "all" }); }} className="bg-primary font-bold text-[10px] uppercase tracking-widest px-8 h-10 rounded-md">
                Reset Audit Hub
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((b) => {
                const images = getImages(b);
                return (
                  <div
                    key={b.id}
                    className="group relative bg-background border border-border hover:border-brand-red/40 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-xl rounded-lg overflow-hidden"
                  >
                    <div className="aspect-[4/3] overflow-hidden relative border-b border-border" onClick={() => navigate(`/motorbike/${b.stock_id || b.id}`)}>
                      <img src={images[0] || "/placeholder.svg"} alt={b.model} className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <Badge className="bg-primary text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider">
                           #{b.stock_id || 'UNIT'}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                         <Badge className={`text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider border-none ${b.status === 'sold' ? 'bg-red-600' : 'bg-green-600'}`}>
                            {b.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
                         </Badge>
                         {b.condition === 'new' && (
                           <Badge className="bg-amber-500 text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider border-none">
                              ZERO KM
                           </Badge>
                         )}
                      </div>

                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         <Button size="icon" variant="secondary" className="h-7 w-7 rounded-md bg-white/90 text-black hover:bg-brand-red hover:text-white border-none shadow-md"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFullscreen({ images: images.length ? images : ["/placeholder.svg"], title: `${b.make} ${b.model}` }); }}
                         >
                            <Maximize2 className="h-3.5 w-3.5" />
                         </Button>
                      </div>
                    </div>

                    <div className="p-3 space-y-3 flex-1 flex flex-col justify-between" onClick={() => navigate(`/motorbike/${b.stock_id || b.id}`)}>
                      <div className="space-y-1">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-tight truncate text-foreground/90 group-hover:text-brand-red transition-colors">{b.make} {b.model}</h3>
                        <div className="flex justify-between items-center border-b border-border/50 pb-1.5 mb-1.5">
                          <p className="text-sm font-black text-foreground tracking-tighter">KSh {Number(b.price).toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{b.year}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3 w-3 text-primary" />
                          <p className="text-[9px] font-bold text-muted-foreground uppercase truncate">{b.engine_cc ? `${b.engine_cc} CC` : '—'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Gauge className="h-3 w-3 text-primary" />
                          <p className="text-[9px] font-bold text-muted-foreground uppercase truncate">{b.mileage || '0 KM'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 mt-auto">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                          <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5 text-green-500" /> Safety Verified</span>
                          <span className="text-brand-red">Audit <ChevronRight className="h-2 w-2 inline" /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Formal Business Leads */}
      <section className="container mx-auto px-4 pb-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-4">
           <div className="bg-background border border-border p-8 rounded-xl flex flex-col items-center text-center space-y-4 shadow-sm hover:border-primary/30 transition-all group">
              <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                 <CreditCard className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-extrabold uppercase tracking-tight">Fleet Asset Financing</h4>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-sm">Aggressive capital backing for motorbike fleets and corporate deliveries. 48h audit cycle.</p>
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
                 <h4 className="text-lg font-extrabold uppercase tracking-tight">Rider Safety Hub</h4>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-sm">Technical support for performance upgrades and safety gear procurement.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
                <Button size="sm" variant="outline" className="px-10 h-10 rounded-md border-border text-foreground font-bold text-[10px] uppercase tracking-widest group-hover:bg-brand-red group-hover:text-white group-hover:border-brand-red flex-1 sm:flex-none" onClick={() => navigate("/contact")}>
                  Direct Technical Line
                </Button>
                <Button size="sm" variant="outline" className="px-10 h-10 rounded-md border-border text-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white flex-1 sm:flex-none" onClick={() => window.open("https://maps.app.goo.gl/7x51yn7VHwHfpEpV8")}>
                  <MapPin className="h-3 w-3 mr-2" />
                  View Strategic Hub
                </Button>
              </div>
           </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="rounded-md border-border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-all hover:bg-secondary"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-3 w-3" /> Return to Institutional Terminal
          </Button>
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

export default MotorbikeCatalogue;
