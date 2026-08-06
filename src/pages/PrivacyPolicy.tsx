import { ShieldCheck, Globe, Trophy, Shield, Lock, Eye, Server, HardDrive, ShieldAlert, Database, UserCheck, Bell, Phone, Mail, MapPin } from "lucide-react";
import HeroSlider from "@/components/HeroSlider";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Encrypted Data Terminal</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              Data <span className="text-brand-red">Privacy.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
              Institutional data governance protocols and security frameworks protecting your digital automotive assets.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto glass-strong rounded-md border border-border p-6 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-10 border-b border-border pb-6">
            <Lock className="h-8 w-8 text-brand-red" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest italic text-foreground">Encrypted Privacy Ledger</h2>
          </div>

          <div className="space-y-12 text-foreground/80">
            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                1. Information Acquisition
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                  We collect information that you provide directly to us through the Ultimate Terminal, including:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { text: "Legal Identity Verification", Icon: UserCheck },
                    { text: "Auth Keys & Biometric Data", Icon: Lock },
                    { text: "Asset Preference History", Icon: Eye },
                    { text: "Transactional Ledger Data", Icon: Database },
                    { text: "Communication Audit Logs", Icon: Bell }
                  ].map((item, i) => (
                    <div key={i} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-secondary/5 p-2 rounded">
                       <item.Icon className="h-3 w-3 text-brand-red" /> {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                2. Operational Data Utilization
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                {[
                  "Maintenance and optimization of terminal services and user experience.",
                  "Processing of high-fidelity automotive transactions and ownership documentation.",
                  "Dispatch of technical support, system alerts, and critical updates.",
                  "Execution of personalized asset recommendation engine based on behavioral data.",
                  "High-level analysis of market trends and terminal usage for institutional growth."
                ].map((text, i) => (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-widest leading-relaxed flex items-start gap-3">
                    <Server className="h-3 w-3 mt-0.5 text-brand-red shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                3. Security Framework & Compliance
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-6">
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed bg-brand-red/5 p-4 rounded border border-brand-red/10">
                  Ultimate Automobiles implements state-of-the-art technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.
                </p>

                <div className="bg-secondary/10 p-6 rounded border border-border">
                   <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-primary flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-brand-red" /> Verified Security Protocols</p>
                   <ul className="text-[10px] font-bold uppercase tracking-widest grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <li className="flex items-center gap-2">• NTSA Data Compliance</li>
                     <li className="flex items-center gap-2">• KEBS Quality Audit</li>
                     <li className="flex items-center gap-2">• KRA Financial Security</li>
                     <li className="flex items-center gap-2">• CAK Protection Protocol</li>
                   </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                4. Data Subject Rights
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                {[
                  "Access and archival request of personal ledger and history.",
                  "Correction of inaccurate institutional information or credentials.",
                  "Request for data deletion (Right to be Forgotten) from active databases.",
                  "Withdrawal of consent for non-essential processing activities."
                ].map((text, i) => (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-widest leading-relaxed flex items-start gap-3">
                    <HardDrive className="h-3 w-3 mt-0.5 text-brand-red shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-brand-red rounded-full" />
                5. Third-Party Advertising & Cookies
              </h3>
              <div className="pl-4 border-l border-primary/20 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                  Our Terminal uses Google AdSense to serve advertisements. Google and other third-party vendors use cookies to serve ads based on a user's prior visits to our website or other websites.
                </p>
                <div className="bg-secondary/5 p-4 rounded border border-border space-y-3">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Critical Disclosures:</p>
                   <ul className="text-[10px] font-medium space-y-2 text-muted-foreground leading-relaxed uppercase tracking-tight">
                     <li>• Third party vendors, including Google, use cookies to serve ads based on your prior visits to this site.</li>
                     <li>• Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our sites and/or other sites on the Internet.</li>
                     <li>• You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" className="text-brand-red underline">Ads Settings</a>.</li>
                     <li>• This Terminal may utilize web beacons and IP address tracking to collect information as a result of ad serving.</li>
                   </ul>
                </div>
              </div>
            </section>

            <div className="mt-16 pt-10 border-t border-border flex flex-col md:flex-row justify-between gap-8 items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Privacy Meta-Data</p>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 space-y-1">
                  <p>Status: Encrypted & Active</p>
                  <p>Revision: 2025.1.1-SEC</p>
                  <p>Audit Date: January 15, 2025</p>
                  <p>© 2025 Justice Ultimate Automobiles</p>
                </div>
              </div>
              <div className="bg-secondary/10 p-6 rounded border border-border max-w-sm w-full text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-4">Support Connection</p>
                 <div className="flex flex-col gap-3">
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-[10px] font-bold uppercase tracking-widest border-border/50 hover:bg-brand-red hover:text-white transition-colors" asChild>
                      <a href="tel:+254722827458">
                        <Phone className="h-3 w-3" />
                        Terminal: +254 722 827 458
                      </a>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto py-3 text-[10px] font-bold uppercase tracking-widest border-border/50 hover:bg-brand-red hover:text-white transition-colors" asChild>
                      <a href="mailto:support@justiceultimateautos.com">
                        <Mail className="h-3 w-3" />
                        Dispatch: support@justiceultimateautos.com
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

export default PrivacyPolicy;