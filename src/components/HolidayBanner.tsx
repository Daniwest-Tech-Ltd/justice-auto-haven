import { useEffect, useState } from "react";
import { getTodayHoliday, getThemeColors, Holiday } from "@/data/holidays";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Import holiday background images
import kenyanFlag from "@/assets/kenyan-flag.png";
import christmasBg from "@/assets/holiday-christmas.jpg";
import newYearBg from "@/assets/holiday-newyear.jpg";
import valentineBg from "@/assets/holiday-valentine.jpg";
import easterBg from "@/assets/holiday-easter.jpg";
import earthBg from "@/assets/holiday-earth.jpg";
import eidBg from "@/assets/holiday-eid.jpg";

// Get ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Format date as "12th December 2025"
const getFormattedDate = (): string => {
  const today = new Date();
  const day = today.getDate();
  const month = format(today, 'MMMM');
  const year = today.getFullYear();
  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

// Map themes to background images
const getHolidayBackground = (theme: Holiday['theme']): string => {
  switch (theme) {
    case 'jamhuri':
    case 'madaraka':
    case 'mashujaa':
      return kenyanFlag;
    case 'christmas':
    case 'boxing':
      return christmasBg;
    case 'newyear':
      return newYearBg;
    case 'valentine':
      return valentineBg;
    case 'easter':
      return easterBg;
    case 'earth':
      return earthBg;
    case 'eid':
      return eidBg;
    case 'women':
      return valentineBg;
    case 'cancer':
    case 'aids':
    case 'labour':
    default:
      return kenyanFlag;
  }
};

// Send holiday notifications via edge function (once per day)
const sendHolidayNotifications = async (holiday: Holiday, formattedDate: string) => {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `holiday_notif_sent_${today}`;
  
  // Check if notifications already sent today
  if (localStorage.getItem(storageKey)) {
    console.log("Holiday notifications already sent today");
    return;
  }

  try {
    console.log(`Sending holiday notifications for ${holiday.name}`);
    const { error } = await supabase.functions.invoke('send-holiday-notifications', {
      body: {
        holiday: {
          name: holiday.name,
          message: holiday.message,
          emoji: holiday.emoji || "🎉",
          formattedDate: formattedDate
        }
      }
    });

    if (error) {
      console.error("Failed to send holiday notifications:", error);
    } else {
      // Mark as sent for today
      localStorage.setItem(storageKey, "true");
      console.log("Holiday notifications sent successfully");
    }
  } catch (err) {
    console.error("Error sending holiday notifications:", err);
  }
};

const HolidayBanner = () => {
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Check holiday status immediately
    const checkHoliday = () => {
      const todayHoliday = getTodayHoliday();
      const date = getFormattedDate();
      setHoliday(todayHoliday);
      setFormattedDate(date);
      
      // Send notifications if it's a holiday
      if (todayHoliday) {
        sendHolidayNotifications(todayHoliday, date);
      }
    };

    checkHoliday();

    // Set up interval to check at midnight for date changes
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Check at midnight and every hour after
    const midnightTimeout = setTimeout(() => {
      checkHoliday();
      // After first midnight check, set up hourly interval
      const hourlyInterval = setInterval(checkHoliday, 60 * 60 * 1000);
      return () => clearInterval(hourlyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, []);

  // Only show if there's a holiday TODAY
  if (!holiday) return null;

  const colors = getThemeColors(holiday.theme);
  const tagline = "Trusted. Reliable. With you every step of the way.";
  const backgroundImage = getHolidayBackground(holiday.theme);

  return (
    <div className="relative overflow-hidden h-10 md:h-12">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Gradient overlay for visibility */}
      <div className={`absolute inset-0 bg-gradient-to-r ${colors.primary}`} />
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
      
      {/* Subtle border glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center px-4">
        {/* Kenyan Flag Icon (for Kenyan holidays) */}
        {['jamhuri', 'madaraka', 'mashujaa'].includes(holiday.theme) && (
          <div className="hidden md:flex items-center mr-4 flex-shrink-0">
            <img 
              src={kenyanFlag} 
              alt="Kenya Flag" 
              className="h-6 w-auto rounded shadow-lg border border-white/20"
            />
            <span className="ml-2 text-white/90 font-bold text-xs tracking-wide">KE</span>
          </div>
        )}
        
        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span className="text-white font-bold text-xs md:text-sm px-4 drop-shadow-lg">
              {holiday.emoji} Happy {holiday.name}! — {formattedDate}
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-white/90 font-medium text-xs md:text-sm px-2 drop-shadow-md">
              {holiday.message}
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-yellow-300 font-bold text-xs md:text-sm px-4 drop-shadow-lg animate-pulse">
              🎁 Get Exclusive Offers at Justice Ultimate Automobiles as we celebrate {holiday.name}! 🎁
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-white/80 text-xs italic px-4 drop-shadow-md">
              {tagline}
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-white font-bold text-xs md:text-sm px-4 drop-shadow-lg">
              {holiday.emoji} Happy {holiday.name}! — {formattedDate}
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-white/90 font-medium text-xs md:text-sm px-2 drop-shadow-md">
              {holiday.message}
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-yellow-300 font-bold text-xs md:text-sm px-4 drop-shadow-lg animate-pulse">
              🎁 Get Exclusive Offers at Justice Ultimate Automobiles as we celebrate {holiday.name}! 🎁
            </span>
            <span className="text-white/50 text-xs px-3">•</span>
            <span className="text-white/80 text-xs italic px-4 drop-shadow-md">
              {tagline}
            </span>
          </div>
        </div>

        {/* Kenyan Flag Icon right side (for Kenyan holidays) */}
        {['jamhuri', 'madaraka', 'mashujaa'].includes(holiday.theme) && (
          <div className="hidden md:flex items-center ml-4 flex-shrink-0">
            <span className="mr-2 text-white/90 font-bold text-xs tracking-wide">🇰🇪</span>
            <img 
              src={kenyanFlag} 
              alt="Kenya Flag" 
              className="h-6 w-auto rounded shadow-lg border border-white/20"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayBanner;
