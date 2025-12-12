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

  const themeColors = getThemeColors(holiday.theme);

  return (
    <Badge 
      variant="outline" 
      className={`${themeColors.primary} text-white border-none px-3 py-1.5 text-xs font-medium whitespace-nowrap`}
    >
      {holiday.emoji} Happy {holiday.name}!
    </Badge>
  );
};

export default DashboardHolidayBanner;
