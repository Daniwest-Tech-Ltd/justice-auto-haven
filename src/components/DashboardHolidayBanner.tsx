import { useState, useEffect } from "react";
import { getTodayHoliday, Holiday } from "@/data/holidays";
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

// Re-export DashboardSnowfall from SeasonalEffects for backward compatibility
export { DashboardSnowfall } from "./SeasonalEffects";

export default DashboardHolidayBanner;
