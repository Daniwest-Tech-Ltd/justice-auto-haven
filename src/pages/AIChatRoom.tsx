import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import { MessageSquare, Bot, Sparkles, Clock, ShieldCheck, Globe, Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSale } from "@/lib/currentSale";

const AIChatRoom = () => {
  const sale = getCurrentSale();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />
      <div className="pt-20">
        {/* Background Overlays */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>

        {/* Hero Header */}
        <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
          <HeroSlider />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-[9px] font-black uppercase tracking-widest text-brand-red mb-4">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Next-Gen Intelligence
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
                AI <span className="text-brand-red">Executive Assistant.</span>
              </h1>

              <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest">
                Our proprietary automotive intelligence engine is currently undergoing a technical synchronization audit.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <Card className="glass-strong border-border overflow-hidden p-8 md:p-16">
              <CardContent className="space-y-8 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-brand-red/20 rounded-full blur-xl animate-pulse" />
                  <Bot className="h-24 w-24 text-brand-red relative z-10 animate-bounce" />
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black uppercase tracking-widest italic">Chatroom Coming Soon</h2>
                  <div className="h-1 w-20 bg-brand-red mx-auto rounded-full" />
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                    Access real-time inventory analytics, financial estimations, and technical vehicle audits through our secure neural network.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-8">
                  {[
                    { icon: ShieldCheck, label: "Secure" },
                    { icon: Globe, label: "Global" },
                    { icon: Activity, label: "Real-time" },
                    { icon: Clock, label: "24/7 Support" }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <item.icon className="h-5 w-5 text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => navigate("/")}
                    className="bg-primary hover:bg-brand-red text-white font-black text-[10px] uppercase tracking-[0.3em] h-12 px-10 rounded-sm"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Terminal
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.4em]">
              © {sale.year} Justice Ultimate Automobiles | AI Core Protocol v1.0.4-beta
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default AIChatRoom;
