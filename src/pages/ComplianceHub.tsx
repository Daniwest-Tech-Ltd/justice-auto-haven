import { ShieldCheck, Globe, Trophy, Shield, FileText, CheckCircle2, AlertCircle, Building2, Scale } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";
import HeroSlider from "@/components/HeroSlider";

const ComplianceHub = () => {
  const [showCertificate, setShowCertificate] = useState(false);

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
      `}</style>

      {/* Hero Header */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Institutional Regulatory Terminal</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              Compliance <span className="text-brand-red">Hub.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
              Verified legal frameworks, operational licenses, and institutional certifications governing Ultimate Automobiles.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Certification Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Business Registration", icon: Building2, status: "Active & Verified", desc: "Officially registered under the Registrar of Companies in Kenya." },
              { title: "NTSA Dealer License", icon: Scale, status: "Certified", desc: "Authorized vehicle dealer and ownership transfer facilitator." },
              { title: "KEBS Quality Audit", icon: CheckCircle2, status: "Compliant", desc: "Full adherence to Kenya Bureau of Standards safety protocols." }
            ].map((item, i) => (
              <div key={i} className="glass-strong border border-border p-8 rounded-md space-y-4 hover:border-brand-red/30 transition-all group">
                <item.icon className="h-10 w-10 text-brand-red group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-black uppercase tracking-widest">{item.title}</h3>
                <div className="bg-brand-red/5 px-3 py-1 border border-brand-red/10 inline-block rounded-full">
                  <p className="text-[8px] font-black uppercase text-brand-red tracking-widest">{item.status}</p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Detailed Verification Protocol */}
          <div className="glass-strong border border-border p-8 md:p-12 rounded-md shadow-2xl">
             <div className="flex items-center gap-3 mb-10 border-b border-border pb-6">
                <ShieldCheck className="h-8 w-8 text-brand-red" />
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest italic">Institutional Verification Protocol</h2>
             </div>

             <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Legal Status</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
                        Ultimate Automobiles maintains full compliance with the Kenyan legal system. We execute every transaction via encrypted channels certified by the Central Bank of Kenya partners and KRA.
                      </p>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Operational Audit</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
                        Our internal audit team performs quarterly reviews of all logistics, financing, and sales protocols to ensure 100% factual integrity and customer protection.
                      </p>
                   </div>
                </div>

                <div className="bg-secondary/10 p-8 rounded border border-border flex flex-col items-center justify-center text-center space-y-6">
                   <div className="h-20 w-20 rounded-full bg-brand-red/10 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-brand-red" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-sm font-black uppercase tracking-widest text-brand-red">Certificate Coming Soon</h4>
                      <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Immediate archival access to corporate credentials will be enabled shortly.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Reporting Terminal */}
          <div className="bg-brand-red/5 border border-brand-red/20 p-8 rounded-md flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-4">
                <AlertCircle className="h-10 w-10 text-brand-red" />
                <div className="space-y-1">
                   <h3 className="text-sm font-black uppercase tracking-widest">Reporting Terminal</h3>
                   <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Report any regulatory concerns or suspicion of non-compliant activity.</p>
                </div>
             </div>
             <Button variant="outline" className="border-brand-red/50 text-brand-red font-black text-[10px] uppercase tracking-widest h-12 px-8 hover:bg-brand-red hover:text-white transition-all" onClick={() => navigate("/contact")}>
                Open Legal Connection
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceHub;
