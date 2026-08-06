import { ShieldCheck, Globe, Trophy, Shield, Scale, UserCheck, CreditCard, Info, Clock, Phone, Mail, MapPin } from "lucide-react";
import HeroSlider from "@/components/HeroSlider";
import { Button } from "@/components/ui/button";

const TermsOfUse = () => {
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
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Legal Framework Terminal</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              Terms of <span className="text-brand-red">Engagement.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
              Institutional protocols governing automotive transactions and service delivery across the Ultimate platform.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto glass-strong rounded-md border border-border p-6 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-10 border-b border-border pb-6">
            <Scale className="h-8 w-8 text-brand-red" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest italic text-foreground">Operational Protocol Ledger</h2>
          </div>

          <div className="space-y-12 text-foreground/80">
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                1. Framework Introduction
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                  Welcome to Justice Ultimate Automobiles, a certified automotive dealership operating in Kenya. By accessing and using our platform (website, services, and applications), you accept and agree to be bound by the terms and provisions of this agreement.
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed opacity-60">
                  If you do not agree to these terms, please discontinue use of our services immediately. These Terms of Use constitute a legally binding agreement between you and Justice Ultimate Automobiles.
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                2. Certification & Regulatory Compliance
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-6">
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed bg-brand-red/5 p-4 rounded border border-brand-red/10">
                  <strong>Justice Ultimate Automobiles is a certified automotive dealer in Kenya</strong>, operating with officially recognized business credentials. We are fully registered and compliant with all regulatory requirements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-secondary/10 p-4 rounded border border-border">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-primary">Core Credentials</p>
                      <ul className="text-[10px] font-bold uppercase tracking-widest space-y-2">
                        <li>• Business Registration</li>
                        <li>• KRA Tax Compliance</li>
                        <li>• NTSA Dealer License</li>
                        <li>• County Business Permits</li>
                      </ul>
                   </div>
                   <div className="bg-secondary/10 p-4 rounded border border-border">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-primary">Verified Authorities</p>
                      <ul className="text-[10px] font-bold uppercase tracking-widest space-y-2">
                        <li>• NTSA / KEBS Audit</li>
                        <li>• KRA / KRB Compliance</li>
                        <li>• KeNHA / KURA Standards</li>
                        <li>• CAK Protection Audit</li>
                      </ul>
                   </div>
                </div>

                <div className="bg-brand-red/5 border border-brand-red/20 p-4 rounded-md">
                   <p className="text-[10px] font-black uppercase text-brand-red tracking-widest flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4" /> Verified Institutional Dealer Status: Active
                   </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                3. Service Inventory Audit
              </h3>
              <div className="pl-4 border-l border-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  "Asset Acquisition (Sales)",
                  "Fleet Rentals (Logistics)",
                  "Trade-In Valuations",
                  "Asset Financing Facilitation",
                  "Unit Inspection & Audit",
                  "Global Logistics Coordination",
                  "Post-Dispatch Support",
                  "Executive Consultation"
                ].map((service, i) => (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="h-1 w-1 bg-brand-red rounded-full" /> {service}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                4. Operational Responsibilities
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                {[
                  "Maintain accurate credential status during all terminal interactions.",
                  "Protect and secure institutional access keys (account credentials).",
                  "Engage in fair, compliant, and non-fraudulent transactional activities.",
                  "Execute all operations within the framework of Kenyan and International law.",
                  "Immediate notification of any security breach or unauthorized terminal access."
                ].map((text, i) => (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-widest leading-relaxed flex items-start gap-3">
                    <UserCheck className="h-3 w-3 mt-0.5 text-brand-red shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                5. Transactional & Fiscal Policy
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-6">
                <div className="bg-secondary/5 border border-border p-6 rounded grid md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><CreditCard className="h-3 w-3" /> Secure Portals</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                        M-Pesa, Swift Bank Transfer, Pesapal Secure Gateway, and In-Office Corporate Ledger.
                      </p>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><Info className="h-3 w-3" /> Refund Protocol</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                        Audit-based processing: 100% pre-audit, 90% pre-dispatch, final post-dispatch is non-reversible.
                      </p>
                   </div>
                </div>
                <div className="p-4 bg-primary text-white rounded-sm text-center">
                   <p className="text-[9px] font-black uppercase tracking-[0.3em]">Institutional Currency: Kenyan Shilling (KES)</p>
                </div>
              </div>
            </section>

            <div className="mt-16 pt-10 border-t border-border flex flex-col md:flex-row justify-between gap-8 items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Framework Meta-Data</p>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 space-y-1">
                  <p>Status: Active Protocol</p>
                  <p>Revision: 2025.1.0-KE</p>
                  <p>Audit Date: January 15, 2025</p>
                  <p>© 2025 Justice Ultimate Automobiles</p>
                </div>
              </div>
              <div className="bg-secondary/10 p-6 rounded border border-border max-w-sm w-full">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-4">Executive Inquiries</p>
                 <div className="flex flex-col gap-3">
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-[10px] font-bold uppercase tracking-widest border-border/50 hover:bg-brand-red hover:text-white transition-colors" asChild>
                      <a href="tel:+254722827458">
                        <Phone className="h-3 w-3" />
                        Contact: +254 722 827 458
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-[10px] font-bold uppercase tracking-widest border-border/50 hover:bg-brand-red hover:text-white transition-colors" asChild>
                      <a href="mailto:support@justiceultimateautos.com">
                        <Mail className="h-3 w-3" />
                        Email: support@justiceultimateautos.com
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-[10px] font-bold uppercase tracking-widest border-border/50 hover:bg-brand-red hover:text-white transition-colors" asChild>
                      <a href="https://maps.app.goo.gl/7x51yn7VHwHfpEpV8" target="_blank" rel="noopener noreferrer">
                        <MapPin className="h-3 w-3" />
                        Location: Westlands, Nairobi Operations
                      </a>
                    </Button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
