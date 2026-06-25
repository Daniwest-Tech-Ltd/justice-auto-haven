import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, ArrowRight, ShieldCheck, Globe, Clock, Activity, CheckCircle } from "lucide-react";
import HeroSlider from "@/components/HeroSlider";
import { getCurrentSale } from "@/lib/currentSale";

const RentalBooking = () => {
  const navigate = useNavigate();
  const sale = getCurrentSale();

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30 shadow-2xl">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Fleet Logistics
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Verified Deployment
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Clock className="h-3 w-3 text-brand-red" />
                24/7 Operations
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
        @keyframes arrow-move-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        .animate-arrow-move {
          animation: arrow-move-horizontal 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* Hero Header */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Logistics Hub: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Reservation <span className="text-brand-red">Terminal.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Initiate a professional vehicle reservation through our integrated logistics gateway. <br />
              Enterprise-grade fleet fulfillment active.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 text-[10px] font-black uppercase tracking-widest hover:bg-secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous Terminal
        </Button>

        <Card className="glass-strong border-border shadow-2xl max-w-2xl mx-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-red)/0.05),transparent_50%)]" />
          <CardHeader className="bg-primary/5 border-b border-border/50 p-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-brand-red/10 flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-brand-red" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest leading-none">External Logistics Gateway</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Institutional Dispatch Access</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8 relative z-10">
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-secondary/5 border border-border/50 space-y-4">
                <div className="flex items-center gap-2">
                   <Activity className="h-3.5 w-3.5 text-brand-red animate-pulse" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Operational Notice</h4>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                   The primary booking terminal has been transitioned to our dedicated corporate logistics platform to ensure maximum dispatch efficiency and regulatory compliance.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full h-16 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl rounded-md group"
                onClick={() => window.open("https://www.justicecorporatelogistics.co.ke", "_blank")}
              >
                Access Logistics Site
                <ArrowRight className="ml-3 h-5 w-5 animate-arrow-move" />
              </Button>

              <div className="pt-4 flex items-center justify-center gap-3">
                 <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                 <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Secure External Redirect Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RentalBooking;
