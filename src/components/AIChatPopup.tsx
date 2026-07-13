import React, { useEffect, useRef } from 'react';
import { X, Search, Send, Home, MessageCircle, Sparkles, Bot, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatPopup = ({ isOpen, onClose }: AIChatPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      {/* Backdrop for mobile focus */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto lg:hidden" onClick={onClose} />

      <div
        ref={popupRef}
        className="relative w-full sm:w-[400px] h-full sm:h-[650px] max-h-screen sm:max-h-[90vh] bg-background border-0 sm:border sm:border-border shadow-2xl rounded-none sm:rounded-2xl overflow-hidden flex flex-col pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-500"
      >
        {/* Institutional Terminal Header */}
        <div className="bg-primary p-6 text-white relative overflow-hidden shrink-0 border-b border-white/5">
           {/* Background HUD elements */}
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.2),transparent_70%)]" />

           <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
              >
                 <X className="h-4 w-4" />
              </Button>
           </div>

           <div className="relative z-10 space-y-4 pt-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red mb-1 text-center">Institutional Intelligence</span>
                <h3 className="text-xl font-black text-center tracking-tighter uppercase italic">Executive <span className="text-brand-red">Terminal.</span></h3>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl flex items-center justify-center group mx-auto w-fit">
                 <img
                   src="/home/chatroom.png"
                   alt="Justice Ultimate AI"
                   className="h-12 w-12 object-contain group-hover:scale-110 transition-transform duration-500"
                 />
              </div>

              <p className="text-[9px] font-bold text-center text-white/80 uppercase tracking-widest leading-relaxed px-4">
                 Our executive intelligence is operational. Please initiate a formal inquiry to proceed.
              </p>
           </div>
        </div>

        {/* Content Area - Institutional Style */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background relative">
           <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

           {/* Help Center Card */}
           <div className="glass-strong border-border/50 rounded-xl p-5 space-y-3 shadow-xl hover:border-brand-red/30 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-3 w-3 text-brand-red" />
                <h4 className="text-[10px] font-black uppercase text-foreground tracking-widest">Knowledge Repository</h4>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                 <Input
                   placeholder="QUERY OFFICIAL PROTOCOLS..."
                   className="h-10 pl-9 bg-secondary/20 border-border/50 text-[10px] font-bold uppercase tracking-widest rounded-lg focus-visible:ring-1 focus-visible:ring-brand-red w-full"
                   disabled
                 />
              </div>
           </div>

           {/* New Conversation Card */}
           <div className="glass-strong border-border/50 rounded-xl p-6 flex items-center justify-between group cursor-pointer hover:border-brand-red/40 transition-all shadow-xl">
              <div className="space-y-1">
                 <h4 className="text-[11px] font-black uppercase text-foreground tracking-widest flex items-center gap-2">
                   <MessageCircle className="h-3 w-3 text-brand-red" />
                   Initiate Formal Inquiry
                 </h4>
                 <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Estimated Latency: 180 Seconds</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all shadow-lg">
                 <Send className="h-4 w-4 rotate-45" />
              </div>
           </div>

           {/* Feature Grid */}
           <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { icon: Sparkles, label: "AI Sourcing", color: "text-brand-red" },
                { icon: Bot, label: "Neural Audit", color: "text-primary" }
              ].map((item, i) => (
                <div key={i} className="glass-strong border-border/40 p-3 rounded-xl flex flex-col items-center gap-2 hover:border-brand-red/20 transition-colors">
                   <item.icon className={`h-5 w-5 ${item.color}`} />
                   <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                </div>
              ))}
           </div>

           {/* Status Placeholder */}
           <div className="pt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-red/10 border border-brand-red/10 text-[9px] font-black uppercase tracking-widest text-brand-red animate-pulse shadow-lg mx-auto">
                 <Activity className="h-3 w-3" />
                 System Synchronization Active
              </div>
           </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-primary/95 backdrop-blur-md border-t border-white/5 p-3 shrink-0 shadow-2xl relative z-20">
           <div className="flex items-center justify-around mb-2">
             <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-brand-red hover:bg-white/5 transition-all">
                <Home className="h-5 w-5" />
                <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
             </Button>
             <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <MessageCircle className="h-5 w-5" />
                <span className="text-[8px] font-black uppercase tracking-widest">Messages</span>
             </Button>
           </div>

           <div className="text-center pb-1">
              <a
                href="https://onlineworldkenya.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em] hover:text-brand-red transition-colors italic flex items-center justify-center gap-1"
              >
                <Globe className="h-2 w-2" /> powered by Online World kenya
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPopup;
