import { useEffect, useState } from "react";
import { getTodayHoliday, getThemeColors, scripture, Holiday } from "@/data/holidays";

const HolidayBanner = () => {
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const todayHoliday = getTodayHoliday();
    setHoliday(todayHoliday);
  }, []);

  if (!holiday || !isVisible) return null;

  const colors = getThemeColors(holiday.theme);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${colors.primary} backdrop-blur-xl border-b border-white/20 shadow-md ${colors.glow}`}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

      {/* Main content - single line compact */}
      <div className="relative z-10 py-1.5 px-4">
        {/* Marquee message */}
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span className="text-white font-semibold text-xs md:text-sm px-4">
              {holiday.emoji} Happy {holiday.name}! {holiday.message} {holiday.emoji}
            </span>
            <span className="text-white/60 text-xs px-4">•</span>
            <span className="text-white/80 text-xs italic px-4">
              {scripture}
            </span>
            <span className="text-white/60 text-xs px-4">•</span>
            <span className="text-white font-semibold text-xs md:text-sm px-4">
              {holiday.emoji} Happy {holiday.name}! {holiday.message} {holiday.emoji}
            </span>
            <span className="text-white/60 text-xs px-4">•</span>
            <span className="text-white/80 text-xs italic px-4">
              {scripture}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1/2 -translate-y-1/2 right-2 text-white/60 hover:text-white transition-colors text-sm leading-none"
          aria-label="Close banner"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default HolidayBanner;
