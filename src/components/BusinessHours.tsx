import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import hourglassGif from "@/assets/hourglass.gif";

const businessHours = {
  Sunday: { open: "10:30", close: "16:00" },
  Monday: { open: "08:00", close: "17:00" },
  Tuesday: { open: "08:00", close: "17:00" },
  Wednesday: { open: "08:00", close: "17:00" },
  Thursday: { open: "08:00", close: "17:00" },
  Friday: { open: "08:00", close: "17:00" },
  Saturday: { open: "08:00", close: "16:00" },
};

const isOpenNow = (day: string, time: string) => {
  const hours = businessHours[day as keyof typeof businessHours];
  if (!hours) return false;

  const now = parseFloat(time.replace(":", "."));
  const open = parseFloat(hours.open.replace(":", "."));
  const close = parseFloat(hours.close.replace(":", "."));

  return now >= open && now <= close;
};

const getTimeUntilClose = (day: string, time: string) => {
  const hours = businessHours[day as keyof typeof businessHours];
  if (!hours) return "00:00:00";

  const [currentHour, currentMinute, currentSecond] = time.split(":").map(Number);
  const [closeHour, closeMinute] = hours.close.split(":").map(Number);

  let totalSeconds = 
    (closeHour * 3600 + closeMinute * 60) - 
    (currentHour * 3600 + currentMinute * 60 + currentSecond);

  if (totalSeconds < 0) totalSeconds = 0;

  const hoursLeft = Math.floor(totalSeconds / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;

  return `${String(hoursLeft).padStart(2, "0")}:${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;
};

export function BusinessHours() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const day = currentTime.toLocaleString("en-US", { weekday: "long" });
    const time = currentTime.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    if (isOpenNow(day, time)) {
      setCountdown(getTimeUntilClose(day, time));
    }
  }, [currentTime]);

  const day = currentTime.toLocaleString("en-US", { weekday: "long" });
  const time = currentTime.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const openStatus = isOpenNow(day, time);
  const todayHours = businessHours[day as keyof typeof businessHours];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`gap-2 px-3 py-2 rounded-full text-xs font-semibold ${
            openStatus
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          <img src={hourglassGif} alt="Timer" className="h-4 w-4" />
          <span className="hidden sm:inline">
            {openStatus ? "OPEN" : "CLOSED"}
          </span>
          {openStatus && countdown !== "00:00:00" && (
            <span className="hidden md:inline text-[10px] opacity-90">
              {countdown}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-card border-border shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Working Hours
            </h3>
            <div
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                openStatus
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {openStatus ? "OPEN NOW" : "CLOSED"}
            </div>
          </div>

          {openStatus && countdown !== "00:00:00" && (
            <div className="bg-blue-600 text-white rounded-lg p-3 text-center">
              <p className="text-xs font-medium mb-1">Closing in</p>
              <p className="text-2xl font-bold font-mono">{countdown}</p>
            </div>
          )}

          <div className="space-y-2">
            {Object.entries(businessHours).map(([dayName, hours]) => (
              <div
                key={dayName}
                className={`flex justify-between py-2 px-3 rounded-md text-sm ${
                  dayName === day
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <span>{dayName}</span>
                <span>
                  {hours.open} – {hours.close}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-sm font-semibold text-center text-blue-600 dark:text-blue-400">
              Contact: 0722827458
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
