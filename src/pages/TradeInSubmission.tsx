import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, RefreshCw, ShieldCheck as Shield, Globe, Navigation, ChevronRight, CheckCircle, Clock, Car, Trophy, Activity } from "lucide-react";
import { getCurrentSale } from "@/lib/currentSale";
import HeroSlider from "@/components/HeroSlider";

const TradeInSubmission = () => {
  const sale = getCurrentSale();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    car_make: "",
    car_model: "",
    car_year: "",
    car_mileage: "",
    car_condition: "good",
    description: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a trade-in request",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("trade_ins")
        .insert([{
          user_id: session.user.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          car_make: formData.car_make,
          car_model: formData.car_model,
          car_year: parseInt(formData.car_year),
          car_mileage: formData.car_mileage,
          car_condition: formData.car_condition,
          description: formData.description,
          status: "pending",
        }]);

      if (error) throw error;

      await supabase.functions.invoke("send-notifications", {
        body: {
          type: "trade_in",
          to: formData.email,
          data: {
            customerName: formData.name,
            carMake: formData.car_make,
            carModel: formData.car_model,
            carYear: formData.car_year,
            carMileage: formData.car_mileage,
            carCondition: formData.car_condition,
          },
        },
      });

      toast({
        title: "Submission Successful",
        description: "Your exchange audit has been initiated. Expect a valuation within 48 business hours.",
      });

      navigate("/customer-dashboard");
    } catch (error: any) {
      toast({
        title: "Audit Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee - Institutional Branding */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30 shadow-2xl">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Asset Valuation Protocol
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Nationwide Exchange Hub
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Trophy className="h-3 w-3 text-brand-red" />
                Aggressive Market Offers
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Unit Verification
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Marquee - Industry Insights */}
      <div className="bg-black/90 text-white/60 py-1.5 overflow-hidden border-b border-white/5 relative z-30">
        <div className="flex whitespace-nowrap animate-marquee-professional" style={{ animationDirection: 'reverse', animationDuration: '60s' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                <Globe className="h-2.5 w-2.5 text-primary" />
                Corporate Media Desk
              </span>
              <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                <Activity className="h-2.5 w-2.5 text-primary" />
                Global Industry Insights
              </span>
              <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                <CheckCircle className="h-2.5 w-2.5 text-primary" />
                Verified Excellence
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
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>

      {/* Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Exchange Desk: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Asset <span className="text-brand-red">Exchange Portal.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Initiate a professional valuation audit for your current vehicle. We facilitate seamless trade-ins against our verified Japanese and European inventory. <br className="hidden md:block" /> Mean appraisal turnaround: 48 business hours.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/catalogue")}>
                Catalogue Hub
              </Button>
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/asset-finance")}>
                Financing Desk
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto mb-12">
          <Card className="glass-strong border-border overflow-hidden group hover:border-brand-red/30 transition-all duration-500">
            <div className="grid md:grid-cols-2 items-center">
              <div className="p-8 md:p-12 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-[10px] font-black uppercase tracking-widest text-brand-red">
                  <RefreshCw className="h-3 w-3 animate-spin-slow" />
                  Premium Exchange Service
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                  Turn Your Current Car Into <span className="text-brand-red">Liquid Capital.</span>
                </h2>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed uppercase tracking-wide">
                  Maximize your asset's value with our institutional exchange program. We offer aggressive market-driven valuations, seamless ownership transfer, and instant credit toward your next luxury upgrade.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xl font-black text-primary italic">100%</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Transparency Audit</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-primary italic">48H</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Valuation Cycle</p>
                  </div>
                </div>
              </div>
              <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden">
                <img
                  src="/home/thome.png"
                  alt="Premium Asset Exchange"
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-[2s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent md:hidden" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Application Track */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Section: Proponent Details */}
              <Card className="rounded-md border-border bg-background shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Proponent Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Full Legal Name</Label>
                    <Input
                      className="h-10 rounded-sm text-xs"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Professional Email</Label>
                    <Input
                      className="h-10 rounded-sm text-xs"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Contact Number</Label>
                    <Input
                      className="h-10 rounded-sm text-xs"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section: Asset Specifications */}
              <Card className="rounded-md border-border bg-background shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Asset Specifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Manufacturer / Make</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        value={formData.car_make}
                        onChange={(e) => setFormData({ ...formData, car_make: e.target.value })}
                        placeholder="e.g., Toyota"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Model / Series</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        value={formData.car_model}
                        onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
                        placeholder="e.g., Land Cruiser"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Model Year</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        type="number"
                        value={formData.car_year}
                        onChange={(e) => setFormData({ ...formData, car_year: e.target.value })}
                        placeholder="e.g., 2020"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Current Odometer (KM)</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        value={formData.car_mileage}
                        onChange={(e) => setFormData({ ...formData, car_mileage: e.target.value })}
                        placeholder="e.g., 50,000"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Mechanical Condition</Label>
                    <Select
                      value={formData.car_condition}
                      onValueChange={(value) => setFormData({ ...formData, car_condition: value })}
                    >
                      <SelectTrigger className="h-10 rounded-sm text-xs uppercase font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent" className="text-xs uppercase">Excellent (Showroom Standard)</SelectItem>
                        <SelectItem value="good" className="text-xs uppercase">Good (Maintained)</SelectItem>
                        <SelectItem value="fair" className="text-xs uppercase">Fair (Standard Wear)</SelectItem>
                        <SelectItem value="poor" className="text-xs uppercase">Poor (Needs Audit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Exchange Audit Notes</Label>
                    <Textarea
                      className="rounded-sm text-xs"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Specify any upgrades, history or known faults..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="bg-secondary/5 border border-border p-4 rounded-md">
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed text-justify px-2">
                  Notice: Our valuation team executes appraisals based on current market analytics and direct physical inspection. <br /> Final offers are subject to verified yard audit.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-14 rounded-md bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl btn-signal">
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Initialize Valuation Audit"}
              </Button>
            </form>
          </div>

          {/* Business Support Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-md border-border bg-secondary/5">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Audit Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  {[
                    { step: "01", title: "Digital Submission", desc: "Initiate your exchange query via this portal." },
                    { step: "02", title: "Market Analysis", desc: "Our team performs a comparative market audit." },
                    { step: "03", title: "Physical Audit", desc: "A brief verification at our Westlands facility." },
                    { step: "04", title: "Asset Exchange", desc: "Finalize paperwork and upgrade your unit." }
                  ].map((track, i) => (
                    <div key={i} className="flex gap-4 group">
                      <span className="text-lg font-black text-primary/30 group-hover:text-primary transition-colors">{track.step}</span>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-tight">{track.title}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">{track.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-sm text-center">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                      <Clock className="h-3 w-3" />
                      Appraisal Cycle: 48 Hours
                   </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border-border bg-background shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Business Integrity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {[
                  { icon: ShieldCheck, title: "Fair Market Value", desc: "Direct market-driven appraisals.", color: "text-emerald-500" },
                  { icon: CheckCircle, title: "NTSA TIMS Verification", desc: "Seamless ownership transfer.", color: "text-primary" },
                  { icon: Navigation, title: "Strategic Location", desc: "Mpesi Lane 11, Westlands.", color: "text-accent" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <item.icon className={`h-4 w-4 ${item.color} mt-0.5`} />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-tight">{item.title}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-md border-border bg-primary text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
              <CardContent className="pt-8 pb-6 text-center space-y-4 relative z-10">
                <div className="h-10 w-10 bg-white/10 rounded-full mx-auto flex items-center justify-center">
                  <Globe className="h-6 w-6 text-brand-red" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-sm font-black uppercase tracking-widest">Valuation Desk</h3>
                   <p className="text-[9px] font-bold uppercase opacity-70">Direct expert consultation</p>
                </div>
                <p className="text-xl font-black font-mono tracking-tighter">0722 827 458</p>
                <Button variant="outline" className="w-full bg-white/5 border-white/20 text-[10px] font-black uppercase tracking-widest h-10 rounded-sm hover:bg-white hover:text-primary transition-all" onClick={() => window.open("https://wa.me/254722827458")}>Initiate WhatsApp Audit</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInSubmission;