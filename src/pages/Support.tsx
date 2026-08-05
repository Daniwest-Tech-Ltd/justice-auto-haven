import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <Header />
      <main className="pt-20">
        {/* Support Hero */}
        <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-6">
              Customer <span className="text-brand-red">Support.</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto uppercase tracking-widest font-bold">
              We're here to assist you with every step of your automotive journey.
            </p>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Live Chat */}
              <Card className="border-slate-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <MessageCircle className="h-10 w-10 text-brand-red mb-4" />
                  <CardTitle className="text-xl font-black uppercase tracking-widest">Live Assistant</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-slate-500 text-xs font-bold uppercase leading-relaxed">
                    Contact us via WhatsApp or Email for instant technical support.
                  </p>
                  <Button className="w-full bg-brand-red hover:bg-brand-red/90 text-[10px] font-black uppercase tracking-widest h-12" onClick={() => window.open('https://wa.me/254722827458', '_blank')}>
                    Start WhatsApp Chat
                  </Button>
                </CardContent>
              </Card>

              {/* Call Support */}
              <Card className="border-slate-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <Phone className="h-10 w-10 text-brand-red mb-4" />
                  <CardTitle className="text-xl font-black uppercase tracking-widest">Phone Support</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-slate-500 text-xs font-bold uppercase leading-relaxed">
                    Speak directly with an automotive expert for immediate assistance.
                  </p>
                  <div className="space-y-2">
                    <p className="text-slate-900 font-black text-lg">+254 722 827 458</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Available 8AM - 6PM</p>
                  </div>
                  <Button variant="outline" className="w-full border-slate-200 text-[10px] font-black uppercase tracking-widest h-12" asChild>
                    <a href="tel:+254722827458">Call Now</a>
                  </Button>
                </CardContent>
              </Card>

              {/* Email Support */}
              <Card className="border-slate-200 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                <CardHeader className="bg-slate-900 text-white p-8">
                  <Mail className="h-10 w-10 text-brand-red mb-4" />
                  <CardTitle className="text-xl font-black uppercase tracking-widest">Email Desk</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-slate-500 text-xs font-bold uppercase leading-relaxed">
                    Send us a detailed inquiry and we will respond within 60 business minutes.
                  </p>
                  <p className="text-slate-900 font-black text-xs break-all uppercase">info@justiceultimateautomobiles.com</p>
                  <Button variant="outline" className="w-full border-slate-200 text-[10px] font-black uppercase tracking-widest h-12" asChild>
                    <a href="mailto:info@justiceultimateautomobiles.com">Send Email</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Further Details Section */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">Visit Our <span className="text-brand-red">Headquarters.</span></h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Experience our inventory in person at our state-of-the-art facility in Westlands.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-brand-red shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location</p>
                      <p className="text-xs font-bold uppercase text-slate-900">Muthithi Road, Westlands, Nairobi, Kenya</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Clock className="h-5 w-5 text-brand-red shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hours</p>
                      <p className="text-xs font-bold uppercase text-slate-900">Mon - Sat: 8:00 AM - 6:00 PM</p>
                      <p className="text-xs font-bold uppercase text-slate-900">Sun: 9:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
                <Button className="bg-slate-900 text-white px-10 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => window.open("https://maps.app.goo.gl/7x51yn7VHwHfpEpV8", "_blank")}>
                  Get Directions <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
                <ShieldCheck className="h-12 w-12 text-brand-red" />
                <h3 className="text-xl font-black uppercase tracking-widest leading-tight">Certified Support Commitment</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                  Our support protocol is designed to provide high-fidelity assistance for car sales, rentals, financing, and trade-in audits. We guarantee factual integrity and fast response times.
                </p>
                <div className="h-1 w-16 bg-brand-red rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
