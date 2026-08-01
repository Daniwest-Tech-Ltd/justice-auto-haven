import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronRight,
  Plus,
  Minus,
  HelpCircle,
  FileText,
  ShieldAlert,
  CreditCard,
  Truck,
  RotateCcw
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const faqs = [
  {
    category: "Buying & Selling",
    questions: [
      { q: "How do I start the car buying process?", a: "You can start by browsing our online catalogue. Once you find a car you like, you can request an audit or visit our Westlands hub." },
      { q: "Do you accept trade-ins?", a: "Yes, we have a specialized trade-in portal where you can submit your current car's details for a professional valuation." },
    ]
  },
  {
    category: "Financing",
    questions: [
      { q: "What is the maximum financing amount?", a: "We facilitate up to 90% asset financing through our tier-1 banking partners for salaried professionals." },
      { q: "How long does loan approval take?", a: "Our mean turnaround time for a financial audit and approval is approximately 72 business hours." },
    ]
  },
  {
    category: "Logistics & Rentals",
    questions: [
      { q: "Do you deliver cars outside Nairobi?", a: "Yes, we provide nationwide logistical fulfillment across all 47 counties in Kenya." },
      { q: "How do I book a rental vehicle?", a: "You can book directly through our Logistics Hub on the website or visit our Westlands office." },
    ]
  }
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const toggleFaq = (q: string) => {
    setActiveFaq(activeFaq === q ? null : q);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <Header />
      <main className="pt-20">
        {/* Help Center Hero */}
        <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-8">
              Help <span className="text-brand-red">Center.</span>
            </h1>
            <div className="max-w-2xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-red group-focus-within:scale-110 transition-transform" />
              <Input
                placeholder="SEARCH KNOWLEDGE BASE..."
                className="h-16 pl-16 rounded-2xl bg-white/10 border-white/20 text-white font-bold uppercase tracking-widest text-xs focus:bg-white focus:text-slate-900 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Quick Topics */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: CreditCard, label: "Payments" },
                { icon: Truck, label: "Logistics" },
                { icon: ShieldAlert, label: "Safety" },
                { icon: RotateCcw, label: "Returns" }
              ].map((topic, i) => (
                <Card key={i} className="bg-white border-slate-200 hover:border-brand-red/30 cursor-pointer group transition-all rounded-2xl shadow-md hover:shadow-xl">
                  <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                    <topic.icon className="h-10 w-10 text-slate-900 group-hover:text-brand-red transition-colors" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{topic.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16 space-y-4">
              <HelpCircle className="h-12 w-12 text-brand-red mx-auto" />
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">Frequently Asked Questions</h2>
              <div className="h-1.5 w-20 bg-brand-red mx-auto rounded-full" />
            </div>

            <div className="space-y-12">
              {faqs.map((group, i) => (
                <div key={i} className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-red border-b border-slate-100 pb-4">{group.category}</h3>
                  <div className="space-y-4">
                    {group.questions.map((faq, j) => (
                      <div key={j} className="border border-slate-100 rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                          onClick={() => toggleFaq(faq.q)}
                        >
                          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-900">{faq.q}</span>
                          {activeFaq === faq.q ? <Minus className="h-4 w-4 text-brand-red" /> : <Plus className="h-4 w-4 text-slate-400" />}
                        </button>
                        {activeFaq === faq.q && (
                          <div className="p-6 pt-0 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[11px] text-slate-500 font-bold uppercase leading-relaxed tracking-wide">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support CTA */}
        <section className="py-24 text-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Still Need Assistance?</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Our executive support team is available 24/7 to provide professional technical guidance.
              </p>
              <div className="flex justify-center gap-4">
                <Button className="bg-brand-red text-white h-16 px-12 rounded-xl text-[11px] font-black uppercase tracking-[0.3em]" onClick={() => navigate("/support")}>
                  Talk to Support
                </Button>
                <Button variant="outline" className="border-slate-200 h-16 px-12 rounded-xl text-[11px] font-black uppercase tracking-[0.3em]" onClick={() => navigate("/contact")}>
                  Send Dispatch
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
