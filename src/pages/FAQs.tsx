import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ShieldCheck, CreditCard, Globe, Info } from "lucide-react";

const FAQs = () => {
  const faqs = [
    {
      category: "Procurement & Importation",
      icon: Globe,
      items: [
        {
          q: "How does Justice Ultimate coordinate direct imports from Japan?",
          a: "We operate a direct logistics bridge between major Japanese auction houses (USS, JAA, HAA) and our terminal in Nairobi. Once a unit is selected, our technical team conducts a pre-shipment audit. We handle all documentation, including KEBS inspection (QISJP/EAA), shipping, and KRA customs clearance."
        },
        {
          q: "What is the typical timeline for an imported vehicle?",
          a: "A direct procurement cycle typically spans 4 to 6 weeks. This includes auction winning (1 week), port logistics and KEBS inspection (1 week), sea transit from Yokohama to Mombasa (3 weeks), and terminal clearance/dispatch (1 week)."
        },
        {
          q: "Are the vehicles verified before they hit the terminal?",
          a: "Yes. Every unit undergoes a 150-point technical yard audit. We verify structural integrity, mileage (via auction grade sheets), and engine diagnostics to ensure the 'Verified Institutional Unit' status."
        }
      ]
    },
    {
      category: "Financing & Lipa Mdogo Mdogo",
      icon: CreditCard,
      items: [
        {
          q: "How does the 'Lipa Mdogo Mdogo' deposit program work?",
          a: "Our flexible deposit program allows you to secure a vehicle with an initial down payment (starting at 30% for many units). The remaining balance is structured over a period of 12 to 48 months through our Tier-1 banking partners (NCBA, Stanbic, I&M)."
        },
        {
          q: "What documents are required for asset financing?",
          a: "For individual applications, we require your KRA Pin, 6 months of certified bank statements, a national ID copy, and 2 passport photos. Corporate entities require business registration documents and audited financial records."
        }
      ]
    },
    {
      category: "Compliance & Safety",
      icon: ShieldCheck,
      items: [
        {
          q: "Is Justice Ultimate Automobiles NTSA registered?",
          a: "Absolutely. We are a fully licensed and registered automotive dealer in Kenya. All units are sold with legitimate NTSA logbook transfers and KRA tax compliance certificates."
        },
        {
          q: "Do you offer warranties on your vehicles?",
          a: "We provide an institutional warranty on all brand-new and certified used units. This typically covers the engine and transmission for 6 months or 5,000 KM (whichever comes first), subject to technical terms."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="relative py-20 bg-slate-900 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-brand-red/10 text-brand-red font-black text-[10px] uppercase tracking-widest">
                <HelpCircle className="h-4 w-4" /> Technical FAQ Hub
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Information <span className="text-brand-red">Terminal.</span></h1>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-loose">Detailed answers to institutional procurement, financing, and compliance queries.</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {faqs.map((group, idx) => (
            <div key={idx} className="space-y-8">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                 <group.icon className="h-6 w-6 text-brand-red" />
                 <h2 className="text-lg font-black uppercase tracking-widest">{group.category}</h2>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`item-${idx}-${i}`} className="border border-border rounded-xl bg-secondary/5 px-6 group transition-all hover:border-brand-red/30">
                    <AccordionTrigger className="hover:no-underline py-6">
                      <span className="text-[11px] sm:text-xs font-black uppercase text-left tracking-wider group-data-[state=open]:text-brand-red">
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 text-sm text-muted-foreground leading-loose font-medium">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          {/* Deep Content Block for SEO/AdSense */}
          <div className="bg-slate-900 p-10 rounded-3xl border border-white/5 space-y-6">
             <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-brand-red" />
                <h3 className="text-sm font-black uppercase text-white tracking-widest">Regulatory Note</h3>
             </div>
             <p className="text-[11px] text-slate-400 leading-loose uppercase font-bold tracking-wider">
               Justice Ultimate Automobiles operates in strict accordance with the Kenya Bureau of Standards (KEBS) and the National Transport and Safety Authority (NTSA). All vehicle valuations are based on current market trends and KRA valuation templates. We are committed to maintaining a transparent, audit-ready environment for all automotive transactions.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQs;
