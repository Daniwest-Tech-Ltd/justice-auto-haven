import { useState, useEffect } from "react";
import { getTodayHoliday, Holiday, getThemeColors } from "@/data/holidays";

const DashboardHolidayBanner = () => {
  const [holiday, setHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    const todayHoliday = getTodayHoliday();
    setHoliday(todayHoliday);
  }, []);

  if (!holiday) return null;

  const themeColors = getThemeColors(holiday.theme);

  return (
    <div 
      className={`w-full py-2 px-4 text-center ${themeColors.primary} text-white text-sm font-medium shadow-sm`}
    >
      {holiday.emoji} Happy {holiday.name}! — {holiday.message}
    </div>
  );
};

export default DashboardHolidayBanner;
