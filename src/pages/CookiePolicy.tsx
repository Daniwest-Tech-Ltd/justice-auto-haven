import { ExternalLink, ShieldCheck, Globe, Trophy, Shield, Cookie, Settings, BarChart, MousePointer2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";
import HeroSlider from "@/components/HeroSlider";

const CookiePolicy = () => {
  const [showCertificate, setShowCertificate] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden">
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
      `}</style>

      {/* Hero Header */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Terminal Experience Optimization</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              Cookie <span className="text-brand-red">Policy.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
              Digital tracking protocols and optimization technologies used to enhance your interaction with the Ultimate Automotive platform.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto glass-strong rounded-md border border-border p-6 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-10 border-b border-border pb-6">
            <Cookie className="h-8 w-8 text-brand-red" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest italic text-foreground">Optimization Registry</h2>
          </div>

          <div className="space-y-12 text-foreground/80">
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                1. Optimization Mechanics
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. They help us understand how you use our platform and improve your experience.
                </p>
              </div>
            </section>

            <section className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                2. Inventory of Cookie Types
              </h3>

              <div className="pl-4 border-l border-primary/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Essential Protocols", icon: ShieldCheck, desc: "Critical for terminal functionality, secure area access, and identity authentication." },
                  { title: "Performance Metrics", icon: BarChart, desc: "Anonymized data collection to monitor platform efficiency and user flow optimization." },
                  { title: "Functional Tools", icon: Settings, desc: "Enablement of enhanced features and personalized preference memory." },
                  { title: "Strategic Targeting", icon: MousePointer2, desc: "Optimization of marketing delivery based on institutional interest profiles." }
                ].map((item, i) => (
                  <div key={i} className="bg-secondary/5 p-4 rounded border border-border space-y-3">
                    <div className="flex items-center gap-2">
                       <item.icon className="h-4 w-4 text-brand-red" />
                       <p className="text-[10px] font-black uppercase tracking-widest">{item.title}</p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-70">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                3. Operational Utilization
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                {[
                  "Maintenance of active authentication sessions.",
                  "Persistence of vehicle comparison and whitelist data.",
                  "Improvement of terminal response times and asset loading.",
                  "Analysis of marketing funnel effectiveness.",
                  "Memory of regional and UI preference configurations."
                ].map((text, i) => (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-widest leading-relaxed flex items-start gap-3">
                    <div className="h-1.5 w-1.5 bg-brand-red rounded-full mt-1.5 shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-16 pt-10 border-t border-border flex flex-col md:flex-row justify-between gap-8 items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cookie Meta-Data</p>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 space-y-1">
                  <p>Status: Active Policy</p>
                  <p>Revision: 2025.1.0-OPT</p>
                  <p>Audit Date: January 15, 2025</p>
                  <p>© 2025 Justice Ultimate Automobiles</p>
                </div>
              </div>
              <div className="bg-secondary/10 p-6 rounded border border-border max-w-sm w-full text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-4">Protocol Support</p>
                 <div className="text-[10px] font-bold uppercase tracking-widest space-y-2">
                    <p>Terminal: +254 722 827 458</p>
                    <p>Dispatch: support@justiceultimateautos.com</p>
                    <p>Location: Westlands, Nairobi Operations</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
