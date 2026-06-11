import { useEffect, useState } from "react";
import loadingGif from "@/assets/loading-animation.gif";

const LoadingScreen = () => {
  const [greeting, setGreeting] = useState("Preparing your experience...");

  useEffect(() => {
    const greetings = [
      "Syncing inventory...",
      "Verifying authenticity...",
      "Optimizing terminal...",
      "Welcome to Ultimate.",
      "Securing access..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % greetings.length;
      setGreeting(greetings[i]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black overflow-hidden select-none">
       {/* High-End Technical Background */}
       <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent_70%)]" />

       <div className="relative w-full max-w-[280px] sm:max-w-md mx-auto p-4 text-center animate-in fade-in duration-500">
         <div className="relative z-10 space-y-6 sm:space-y-10">
            {/* Visual Centerpiece */}
            <div className="flex flex-col items-center gap-4 sm:gap-6">
               <div className="relative group">
                  <div className="absolute -inset-8 sm:-inset-12 bg-brand-red/15 rounded-full blur-[30px] sm:blur-[60px] animate-pulse" />
                  <div className="relative h-24 w-24 sm:h-40 sm:w-40 flex items-center justify-center">
                    {/* Pulsing Outer Ring */}
                    <div className="absolute inset-0 border-[1px] border-brand-red/20 rounded-full animate-ping-slow" />

                    <img
                      src={loadingGif}
                      alt="ULTIMATE"
                      className="h-16 w-16 sm:h-28 sm:w-28 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    />

                    {/* Technical Scanning Lines */}
                    <div className="absolute inset-0 border-t border-brand-red/30 rounded-full animate-spin duration-[4000ms]" />
                    <div className="absolute inset-2 sm:inset-3 border-b border-brand-red/15 rounded-full animate-spin-reverse duration-[3000ms]" />
                  </div>
               </div>

               {/* Brand Identity */}
               <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-4">
                     <div className="h-[1px] w-6 sm:w-10 bg-brand-red/40 rounded-full" />
                     <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white uppercase italic">
                        ULTIMATE
                     </h1>
                     <div className="h-[1px] w-6 sm:w-10 bg-brand-red/40 rounded-full" />
                  </div>
                  <div className="px-3 py-0.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                    <p className="text-[7px] sm:text-[9px] font-black tracking-[0.4em] sm:tracking-[0.6em] uppercase text-brand-red animate-pulse">Intelligence Terminal</p>
                  </div>
               </div>
            </div>

            {/* Status Feedback */}
            <div className="space-y-4 sm:space-y-6 max-w-[180px] sm:max-w-[240px] mx-auto">
               <div className="relative h-0.5 sm:h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-brand-red animate-loading-bar w-1/3 rounded-full shadow-[0_0_10px_#ef4444]" />
               </div>

               <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <p className="text-[8px] sm:text-[10px] font-bold text-white/60 uppercase tracking-widest h-3">
                    {greeting}
                  </p>
                  <p className="text-[6px] sm:text-[7px] font-black text-white/20 uppercase tracking-[0.3em]">Justice Ultimate Automobiles</p>
               </div>
            </div>

            {/* Friendly Marketing Note */}
            <div className="pt-2 sm:pt-4">
               <p className="text-[8px] sm:text-[10px] font-bold text-brand-red/50 italic tracking-wider uppercase">
                 Luxury. Precision. Performance.
               </p>
            </div>
         </div>
       </div>

       <style>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .animate-loading-bar {
            animation: loading-bar 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }
          @keyframes spin-reverse {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 2.5s linear infinite;
          }
          @keyframes ping-slow {
            0% { transform: scale(0.95); opacity: 0.6; }
            50% { transform: scale(1.05); opacity: 0.2; }
            100% { transform: scale(0.95); opacity: 0.6; }
          }
          .animate-ping-slow {
            animation: ping-slow 3s ease-in-out infinite;
          }
       `}</style>
    </div>
  );
};

export default LoadingScreen;
