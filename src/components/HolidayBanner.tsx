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
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${colors.primary} backdrop-blur-xl border-b border-white/20 shadow-lg ${colors.glow}`}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 py-2 px-4">
        {/* Holiday name and date */}
        <div className="text-center mb-1">
          <span className="text-white/90 text-xs md:text-sm font-medium">
            Today is <span className={`font-bold ${colors.accent}`}>{holiday.name}</span> — {formattedDate}
          </span>
        </div>

        {/* Marquee message */}
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span className="text-white font-semibold text-sm md:text-base px-4">
              {holiday.emoji} {holiday.message} {holiday.emoji}
            </span>
            <span className="text-white/60 text-xs md:text-sm px-8">|</span>
            <span className="text-white/80 text-xs md:text-sm italic px-4">
              {scripture}
            </span>
            <span className="text-white/60 text-xs md:text-sm px-8">|</span>
            <span className="text-white font-semibold text-sm md:text-base px-4">
              {holiday.emoji} {holiday.message} {holiday.emoji}
            </span>
            <span className="text-white/60 text-xs md:text-sm px-8">|</span>
            <span className="text-white/80 text-xs md:text-sm italic px-4">
              {scripture}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-2 text-white/60 hover:text-white transition-colors text-lg leading-none"
          aria-label="Close banner"
        >
          ×
        </button>
      </div>

      {/* Bottom glow line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent`} />
    </div>
  );
};

export default HolidayBanner;
