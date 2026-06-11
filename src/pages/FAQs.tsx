import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, ShieldCheck, Globe, Trophy, Shield, HelpCircle, Cpu, BookOpen, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";
import HeroSlider from "@/components/HeroSlider";

const FAQs = () => {
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
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Institutional Knowledge Base</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              Compliance & <span className="text-brand-red">Technical Hub.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
              Centralized terminal for operational queries, regulatory frameworks, and technical asset protocols.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
           {/* Section 1: Operational Compliance */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                 <ShieldCheck className="h-6 w-6 text-brand-red" />
                 <h2 className="text-lg font-black uppercase tracking-widest italic text-foreground">Operational Compliance Hub</h2>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {[
                  {
                    q: "Is Ultimate Automobiles a certified dealership?",
                    a: "Yes. We operate as a tier-1 certified automotive terminal in Kenya. All business credentials and tax compliance frameworks are active and verified by relevant national authorities.",
                    cert: true
                  },
                  {
                    q: "What regulatory frameworks do you follow?",
                    a: "Our operations strictly adhere to NTSA vehicle transfer protocols, KEBS quality standards, and KRA tax compliance frameworks. We execute every transaction through military-grade encrypted legal channels."
                  },
                  {
                    q: "How can I verify your corporate status?",
                    a: "Direct archival access to our business permit and registration certificates is available through our terminal dashboard for verified users, or via the quick-link below.",
                    cert: true
                  }
                ].map((item, i) => (
                  <AccordionItem key={i} value={`comp-${i}`} className="border border-border rounded-md px-4 bg-secondary/5 overflow-hidden">
                    <AccordionTrigger className="text-[11px] font-black uppercase tracking-widest hover:no-underline text-left leading-relaxed">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed pt-4 border-t border-border/50">
                      <p className="mb-4">{item.a}</p>
                      {item.cert && (
                        <div className="bg-brand-red/5 border border-brand-red/20 p-3 rounded-md inline-block">
                           <p className="text-[9px] font-black uppercase text-brand-red tracking-widest flex items-center gap-2">
                             <Clock className="h-3 w-3" /> Professional Certificate Coming Soon
                           </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
           </div>

           {/* Section 2: Technical Asset Hub */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                 <Cpu className="h-6 w-6 text-brand-red" />
                 <h2 className="text-lg font-black uppercase tracking-widest italic text-foreground">Technical Asset Protocols</h2>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                {[
                  {
                    q: "How are inventory units verified?",
                    a: "Every unit undergoes a 150-point technical audit covering mechanical integrity, structural status, and digital diagnostics. We utilize specialized scanning hardware to ensure 100% accuracy of listed specifications."
                  },
                  {
                    q: "What is the capital coverage protocol?",
                    a: "We facilitate up to 90% capital coverage for salaried professionals and 80% for business entities through our nationwide banking network. Interest rates are capped according to current market benchmarks."
                  },
                  {
                    q: "Terminal transaction encryption?",
                    a: "All financial interactions are executed via SSL-encrypted gateways and verified through the Pesapal Secure Network or direct SWIFT bank-to-bank transfers."
                  }
                ].map((item, i) => (
                  <AccordionItem key={i} value={`tech-${i}`} className="border border-border rounded-md px-4 bg-secondary/5">
                    <AccordionTrigger className="text-[11px] font-black uppercase tracking-widest hover:no-underline text-left leading-relaxed">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed pt-4 border-t border-border/50">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
           </div>

           {/* Support Contact */}
           <div className="bg-primary p-8 rounded-md text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.2),transparent_50%)]" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="text-center md:text-left space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center justify-center md:justify-start gap-2">
                       <HelpCircle className="h-6 w-6 text-brand-red" />
                       Buffer Overload?
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">If your query requires immediate executive attention.</p>
                 </div>
                 <div className="flex gap-4">
                    <Button variant="outline" className="bg-white/5 border-white/20 text-[10px] font-black uppercase tracking-[0.2em] h-12 px-8 hover:bg-white hover:text-primary" onClick={() => window.location.href = "mailto:support@justiceultimateautos.com"}>
                       Direct Dispatch
                    </Button>
                    <Button variant="outline" className="bg-brand-red border-none text-[10px] font-black uppercase tracking-[0.2em] h-12 px-8 hover:bg-brand-red/90" onClick={() => window.location.href = "tel:+254722827458"}>
                       Call Terminal
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FAQs;