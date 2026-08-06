import { useState, useEffect } from "react";
import { ArrowUp, Share2, Facebook, Instagram, Youtube, Twitter, MessageCircle, X } from "lucide-react";
import { Button } from "./ui/button";

const FloatingActions = () => {
  const [isVisible, setIsOpen] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 50) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/justiceultimateautomobiles", label: "Facebook" },
    { icon: Instagram, href: "https://www.instagram.com/justiceultimateautomobiles", label: "Instagram" },
    { icon: Youtube, href: "https://www.youtube.com/@justiceultimateautomobiles", label: "YouTube" },
    { icon: Twitter, href: "https://twitter.com/justiceultimate", label: "Twitter" },
    { icon: MessageCircle, href: "https://wa.me/254722827458", label: "WhatsApp" },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex flex-col items-center gap-4 pointer-events-none">
      <style>{`
        @keyframes bounce-up-down {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-up-down {
          animation: bounce-up-down 2s infinite ease-in-out;
        }
      `}</style>

      {/* Scroll to Top Button - Institutional Gold Design */}
      <div className={`transition-all duration-700 transform pointer-events-auto ${showScroll ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10'}`}>
        <Button
          size="icon"
          onClick={scrollToTop}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FFD700] via-[#B8860B] to-[#FFD700] text-white shadow-[0_10px_30px_-10px_rgba(184,134,11,0.6)] border-none animate-bounce-up-down hover:brightness-110 transition-all active:scale-95 group relative overflow-hidden"
          title="Return to Top"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ArrowUp className="h-7 w-7 drop-shadow-lg" />
        </Button>
      </div>

      {/* Share Container */}
      <div className="relative pointer-events-auto">
        {isVisible && (
          <div className="absolute right-full mr-4 bottom-0 flex flex-col gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-4 fade-in duration-300 min-w-[50px]">
             <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-red text-center pb-2 mb-1 border-b border-slate-50 dark:border-slate-800">Direct</p>
             {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-red hover:text-white transition-all flex items-center justify-center group/item shadow-sm hover:shadow-brand-red/20 active:scale-90"
                  title={social.label}
                >
                   <social.icon className="h-5 w-5 transition-transform group-hover/item:scale-110" />
                </a>
             ))}
          </div>
        )}
        <Button
          size="icon"
          onClick={() => setIsOpen(!isVisible)}
          className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-500 border-2 ${isVisible ? 'bg-slate-900 text-white border-white/10 rotate-90' : 'bg-white text-slate-900 hover:bg-slate-50 border-slate-100'}`}
        >
          {isVisible ? <X className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
};

export default FloatingActions;
