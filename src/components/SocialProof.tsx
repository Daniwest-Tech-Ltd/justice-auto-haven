import { useState, useEffect } from "react";
import { Eye, Flame, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const LiveViewers = () => {
  const [viewers, setViewers] = useState(Math.floor(Math.random() * (120 - 40 + 1)) + 40);

  useEffect(() => {
    const interval = setInterval(() => {
      const isJump = Math.random() > 0.7;
      if (isJump) {
        setViewers(Math.floor(Math.random() * (130 - 20 + 1)) + 20);
      } else {
        const nudge = Math.floor(Math.random() * 7) - 3;
        setViewers(prev => {
          const next = prev + nudge;
          if (next < 15) return 24;
          if (next > 150) return 138;
          return next;
        });
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 w-fit">
      <Eye className="h-3.5 w-3.5 animate-pulse" />
      <span>{viewers} people are viewing this car</span>
    </div>
  );
};

export const SalesUrgency = () => {
  return (
    <div className="bg-brand-red/10 border border-brand-red/20 rounded-lg px-4 py-2 flex items-center gap-2.5 text-brand-red font-bold text-[10px] uppercase tracking-wider animate-pulse shadow-sm backdrop-blur-md">
      <Flame className="h-4 w-4 fill-brand-red" />
      <span>10 units sold this month!</span>
    </div>
  );
};

export const StockUrgency = ({ count }: { count?: number | null }) => {
  if (!count || count > 5) return null;
  return (
    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider bg-orange-500/5 px-3 py-1.5 rounded-lg border border-orange-500/10 w-fit">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>Hurry! Only {count} left in stock</span>
    </div>
  );
};
