import React, { useEffect, useRef } from 'react';
import { X, Search, Send, Home, MessageCircle, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";

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
      <div
        ref={popupRef}
        className="relative w-full max-w-[380px] h-[600px] max-h-[85vh] bg-[#f8faff] shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-500 border border-border/50"
      >
        {/* Modern Header - HostAfrica Style */}
        <div className="bg-[#0091ea] p-6 text-white relative overflow-hidden shrink-0 rounded-b-[2rem]">
           <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              >
                 <X className="h-4 w-4" />
              </Button>
           </div>

           <div className="relative z-10 space-y-4 pt-2">
              <h3 className="text-xl font-black text-center tracking-tight">Welcome to</h3>
              <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-center">
                 <img src={logo} alt="Justice Ultimate" className="h-10 object-contain" />
              </div>
              <p className="text-[11px] font-bold text-center text-white/90 uppercase tracking-widest leading-relaxed">
                 We are live and ready to chat with you now. <br /> Say something to start a live chat.
              </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 -mt-4 z-10">
           {/* Help Center Card */}
           <div className="bg-white rounded-xl p-5 shadow-sm border border-border/40 space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">Help Center</h4>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                 <Input
                   placeholder="Search for answers"
                   className="h-10 pl-9 bg-gray-50 border-none text-[11px] rounded-lg focus-visible:ring-1 focus-visible:ring-[#0091ea]"
                   disabled
                 />
              </div>
           </div>

           {/* New Conversation Card */}
           <div className="bg-white rounded-xl p-5 shadow-sm border border-border/40 flex items-center justify-between group cursor-pointer hover:border-[#0091ea]/30 transition-all">
              <div className="space-y-1">
                 <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">New Conversation</h4>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">We typically reply in a few minutes</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#0091ea]/5 flex items-center justify-center text-[#0091ea] group-hover:bg-[#0091ea] group-hover:text-white transition-all">
                 <Send className="h-4 w-4 rotate-45" />
              </div>
           </div>

           {/* AI Status Placeholder */}
           <div className="pt-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/5 border border-brand-red/10 text-[8px] font-black uppercase tracking-widest text-brand-red animate-pulse">
                 <Sparkles className="h-3 w-3" />
                 Core Synchronization in Progress
              </div>
           </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-border/40 p-2 flex items-center justify-around shrink-0">
           <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-[#0091ea]">
              <Home className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
           </Button>
           <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-gray-400">
              <MessageCircle className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Messages</span>
           </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPopup;
