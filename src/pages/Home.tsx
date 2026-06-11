import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Car, Globe, Zap, Users, Search,
  CheckCircle, Heart, ArrowRight,
  Clock, DollarSign, Settings, Phone, Gauge, Mail,
  Activity, ShieldCheck, Briefcase,
  Navigation, Calendar, ChevronRight, Headphones, Star,
  Trophy,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentSale } from "@/lib/currentSale";
import specialOffer from "@/assets/special-offer.png";

const Home = () => {
  const sale = getCurrentSale();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [heroCars, setHeroCars] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    const { data: featuredData } = await supabase
      .from("cars")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(12);
    if (featuredData) setFeaturedCars(featuredData);

    const { data: heroData } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(4);
    if (heroData) setHeroCars(heroData);

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

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white overflow-x-hidden font-sans antialiased">
      {/* HUD-Style Layout Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Dynamic Trust Bar */}
      <div className="bg-primary/95 text-[9px] sm:text-[10px] font-black tracking-[0.4em] uppercase py-2 relative z-30 border-b border-white/5 shadow-2xl overflow-hidden">
        <div className="container mx-auto px-4 flex justify-center items-center gap-12 whitespace-nowrap animate-in fade-in duration-1000">
          <span className="flex items-center gap-2 text-white/80 group cursor-default">
            <ShieldCheck className="h-3 w-3 text-brand-red" />
            <span className="group-hover:text-white transition-colors uppercase">NTSA TIMS Verification</span>
          </span>
          <span className="flex items-center gap-2 text-white/80 group cursor-default">
            <Globe className="h-3 w-3 text-brand-red" />
            <span className="group-hover:text-white transition-colors uppercase">Direct Japanese Logistics</span>
          </span>
          <span className="hidden md:flex items-center gap-2 text-white/80 group cursor-default">
            <Trophy className="h-3 w-3 text-brand-red" />
            <span className="group-hover:text-white transition-colors uppercase">Certified Asset Scaling</span>
          </span>
        </div>
      </div>

      {/* Hero Showcase - Executive Minimalist */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/5 py-20">
        <div className="absolute inset-0 z-0">
          {heroCars.map((car, index) => (
            <div
              key={car.id}
              className={`absolute inset-0 transition-all duration-[3000ms] ease-in-out ${
                index === currentSlide ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-105"
              }`}
            >
              {getImageUrl(car.images) && (
                <img src={getImageUrl(car.images)} alt={car.make} className="w-full h-full object-cover object-center grayscale-[20%] contrast-[1.1] brightness-[0.45]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-brand-red/30 bg-brand-red/10 backdrop-blur-md text-brand-red font-mono text-[9px] font-black tracking-[0.3em] uppercase mx-auto">
              <span className="h-2 w-2 rounded-full bg-brand-red animate-pulse" />
              Operational Exchange Desk: {sale.year}
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white uppercase whitespace-nowrap">
                Executive <span className="text-brand-red drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">Automotive.</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-white/80 font-bold max-w-2xl mx-auto leading-loose uppercase tracking-[0.1em]">
                Authorized procurement hub for Japanese and European inventory. We facilitate verified asset acquisition, 90% institutional financing, and nationwide logistical fulfillment.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button size="lg" className="rounded-md px-12 h-16 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all btn-signal shadow-2xl" onClick={() => navigate("/catalogue")}>
                <span className="flex items-center gap-2">Scan Inventory <ArrowRight className="h-4 w-4" /></span>
              </Button>
              <Button size="lg" variant="outline" className="rounded-md px-12 h-16 border-white/20 hover:border-brand-red/50 text-white font-black text-[11px] uppercase tracking-[0.3em] glass-strong btn-signal shadow-2xl" onClick={() => navigate("/asset-finance")}>
                <span>Financing Desk</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Audit Module (Search) */}
      <section className="relative z-20 -mt-10">
        <div className="container mx-auto px-4">
          <div className="bg-card border border-border p-3 shadow-2xl flex flex-col md:flex-row gap-3 items-stretch rounded-md">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-red" />
              <Input
                placeholder="Asset Query: VIN, Manufacturer or Model Codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 rounded-sm bg-background border-border focus:border-brand-red/50 transition-all text-[11px] font-bold uppercase tracking-widest"
              />
            </div>

            <div className="w-full md:w-64">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-14 rounded-sm bg-background border-border text-[10px] font-black uppercase tracking-widest">
                  <SelectValue placeholder="Brand Filter" />
                </SelectTrigger>
                <SelectContent className="border-border bg-background">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name} className="text-[10px] uppercase font-black">{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSearch} size="lg" className="h-14 px-12 rounded-sm bg-primary hover:bg-brand-red transition-colors text-[10px] font-black uppercase tracking-[0.3em]">
              Execute Audit
            </Button>
          </div>
        </div>
      </section>

      {/* Current Assets - MICRO BUSINESS TILES */}
      {featuredCars.length > 0 && (
        <section className="py-24" aria-label="Asset Inventory">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Active Inventory</p>
              <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase leading-none">Strategic Units</h2>
              <div className="h-1 w-20 bg-brand-red mt-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredCars.map((car) => {
                const imageUrl = getImageUrl(car.images);
                return (
                  <Card
                    key={car.id} 
                    className="group relative bg-background border-border hover:border-brand-red/40 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-md"
                    onClick={() => navigate(`/car/${car.id}`)}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={imageUrl || "/placeholder.svg"} alt={car.model} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      <div className="absolute top-3 right-3">
                         <Badge className="bg-brand-red text-white text-[8px] font-black uppercase rounded-sm py-1 px-2 border-none">Available</Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-2">
                           <h3 className="text-xs font-black uppercase tracking-widest text-white group-hover:text-brand-red transition-colors line-clamp-1">{car.make} {car.model}</h3>
                           <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-brand-red group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                        <p className="text-base font-black text-white tracking-tighter mt-1">KSh {car.price?.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-y border-border py-3 mb-4">
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Model</p>
                          <p className="text-[10px] font-black text-white">{car.year}</p>
                        </div>
                        <div className="text-center border-x border-border space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase px-1">Drive</p>
                          <p className="text-[10px] font-black text-white uppercase">{car.transmission?.slice(0, 3) || 'AWD'}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Fuel</p>
                          <p className="text-[10px] font-black text-white uppercase">{car.fuel_type?.slice(0, 3) || 'PET'}</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-brand-red w-full scale-x-[0.2] group-hover:scale-x-100 transition-transform origin-left duration-700" />
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2 tracking-widest group-hover:text-white transition-colors">Technical Verification Active</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-16 text-center">
               <Button variant="outline" className="border-border text-white font-black text-[10px] uppercase tracking-[0.4em] h-14 px-12 rounded-md hover:bg-white hover:text-primary transition-all" onClick={() => navigate("/catalogue")}>
                  Full Operations Ledger <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
            </div>
          </div>
        </section>
      )}

      {/* Financial Sourcing - Institutional Style */}
      <section className="py-24 bg-secondary/10 border-y border-border relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <Badge className="bg-brand-red text-white px-4 py-1 text-[10px] font-black tracking-[0.2em] uppercase rounded-sm border-none">
                   Financial Logistics
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.8] text-white uppercase">
                  Capital <br />
                  <span className="text-brand-red">Solutions.</span>
                </h2>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed max-w-lg font-bold border-l-4 border-brand-red pl-6 uppercase tracking-[0.05em]">
                  Tier-1 banking integration providing aggressive 90% asset funding. Streamlined 48-hour approval cycles for validated corporate profiles and salaried entities.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="bg-background/50 border-border p-6 space-y-4 hover:border-brand-red/30 transition-all group rounded-md">
                  <div className="h-12 w-12 bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-brand-red group-hover:border-brand-red transition-all duration-500 rounded-sm">
                    <Users className="h-6 w-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Salaried Stream</h4>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">Accelerated 90% funding for employees with 3 payslip dispatch.</p>
                  </div>
                </Card>
                <Card className="bg-background/50 border-border p-6 space-y-4 hover:border-brand-red/30 transition-all group rounded-md">
                  <div className="h-12 w-12 bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-brand-red group-hover:border-brand-red transition-all duration-500 rounded-sm">
                    <Briefcase className="h-6 w-6 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Corporate Scaling</h4>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">Business unit acquisition with customized repayment schedules.</p>
                  </div>
                </Card>
              </div>

              <Button className="rounded-md px-14 h-16 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl" onClick={() => navigate("/asset-finance")}>
                Initialize Funding Protocol
              </Button>
            </div>

            <div className="relative group">
              <Card className="border-border p-3 rounded-md overflow-hidden bg-background">
                 <div className="aspect-[4/3] relative overflow-hidden bg-primary/20">
                    <img src={specialOffer} alt="Financial Showcase" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-black/60">
                       <p className="text-[10px] font-black tracking-[0.6em] text-brand-red uppercase mb-4 animate-pulse">Market Opportunity</p>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Q1 Interest Caps</h3>
                       <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest mb-10 max-w-xs leading-relaxed">Lowest historical rates secured for 2026 operations. Active for limited verified units.</p>
                       <Button size="lg" className="bg-brand-red hover:bg-brand-red/80 rounded-sm px-12 h-14 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
                          Request Asset Deck
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

      {/* Advisory & Support - High Density */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-20">
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-brand-red">Operational Standards</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">Executive Advisory</h2>
            <div className="h-1.5 w-32 bg-brand-red mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Headphones,
                title: "Asset Advisory",
                desc: "1-on-1 technical consultation for high-value fleet acquisition and unit selection."
              },
              {
                icon: ShieldCheck,
                title: "Quality Audit",
                desc: "Unified 7-day mechanical verification protocol following nationwide dispatch."
              },
              {
                icon: Clock,
                title: "Logistics Engine",
                desc: "Nationwide inventory fulfillment within 48-72 business hours via secure carriers."
              }
            ].map((item, i) => (
              <Card key={i} className="bg-background border-border p-12 hover:bg-secondary/5 transition-all hover:border-brand-red/30 rounded-md flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 rounded-sm group-hover:bg-brand-red transition-all">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-sm font-black tracking-[0.3em] uppercase text-white mb-6">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Business KPI Dashboard - High Speed Style */}
          <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border border-border bg-card p-0 overflow-hidden rounded-md max-w-6xl mx-auto shadow-2xl">
            {[
              { val: "5.2K", label: "Validated Units" },
              { val: "4.9/5", label: "Client Equity" },
              { val: "100%", label: "VIN Authenticity" },
              { val: "47", label: "County Hubs" }
            ].map((stat, i) => (
              <div key={i} className="text-center py-12 first:border-l-0 border-l border-border group hover:bg-primary transition-all duration-500">
                <p className="text-3xl md:text-4xl font-black font-mono tracking-tighter text-white mb-2">{stat.val}</p>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.4em] group-hover:text-white/80 transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action Footer Call - Direct Business Lead */}
      <section className="py-24 bg-primary relative border-t-2 border-brand-red">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center text-center lg:text-left gap-16">
          <div className="space-y-6">
             <p className="text-[11px] font-black uppercase tracking-[1em] text-brand-red">Initiate Protocol</p>
             <h4 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none uppercase">Establish <br /> <span className="text-white/40">Direct Contact.</span></h4>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto items-center lg:items-start">
             <Button size="lg" className="rounded-md h-20 px-20 bg-white text-primary hover:bg-brand-red hover:text-white font-black text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl border-none" onClick={() => navigate("/contact")}>
                <span>Open technical dispatch</span>
             </Button>
             <div className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-[0.4em]">
                <Activity className="h-3 w-3 animate-pulse text-brand-red" />
                Response latency: Average 12 minutes
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
