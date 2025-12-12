import { useEffect, useState } from "react";
import { getTodayHoliday, getThemeColors, scripture, Holiday } from "@/data/holidays";

const HolidayBanner = () => {
  const [holiday, setHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    const todayHoliday = getTodayHoliday();
    setHoliday(todayHoliday);
  }, []);

  if (!holiday) return null;

  const colors = getThemeColors(holiday.theme);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${colors.primary} backdrop-blur-xl border-b border-white/20 shadow-md ${colors.glow} h-7 flex items-center`}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

      {/* Main content - ultra compact */}
      <div className="relative z-10 w-full h-full flex items-center px-3">
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee align-middle">
            <span className="text-white font-semibold text-[11px] md:text-xs px-4">
              {holiday.emoji} Happy {holiday.name}! {holiday.message} {holiday.emoji}
            </span>
            <span className="text-white/60 text-[10px] px-3">•</span>
            <span className="text-white/80 text-[10px] italic px-4">
              {scripture}
            </span>
            <span className="text-white/60 text-[10px] px-3">•</span>
            <span className="text-white font-semibold text-[11px] md:text-xs px-4">
              {holiday.emoji} Happy {holiday.name}! {holiday.message} {holiday.emoji}
            </span>
            <span className="text-white/60 text-[10px] px-3">•</span>
            <span className="text-white/80 text-[10px] italic px-4">
              {scripture}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayBanner;
