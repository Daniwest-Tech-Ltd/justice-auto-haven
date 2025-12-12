import { useState, useEffect } from "react";
import { getTodayHoliday, Holiday, getThemeColors } from "@/data/holidays";
import { Badge } from "@/components/ui/badge";

const DashboardHolidayBanner = () => {
  const [holiday, setHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    const todayHoliday = getTodayHoliday();
    setHoliday(todayHoliday);
  }, []);

  if (!holiday) return null;

  return (
    <Badge 
      className="bg-primary text-primary-foreground border-none px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-sm"
    >
      {holiday.emoji} Happy {holiday.name}!
    </Badge>
  );
};

// Snowfall component for dashboards
export const DashboardSnowfall = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute text-white opacity-80 animate-snowfall"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
            fontSize: `${8 + Math.random() * 12}px`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default DashboardHolidayBanner;
