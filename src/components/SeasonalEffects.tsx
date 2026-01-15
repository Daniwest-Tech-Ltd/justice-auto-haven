import { useSeasonalEffects } from "@/hooks/useSeasonalEffects";

/**
 * Animated sun effect for non-Christmas season
 */
export const SunEffect = () => {
  const { showSunEffect } = useSeasonalEffects();

  if (!showSunEffect) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      {/* Main sun glow */}
      <div className="relative">
        {/* Outer glow */}
        <div 
          className="absolute -inset-8 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, rgba(255, 200, 50, 0.4) 0%, rgba(255, 150, 0, 0.2) 40%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
        {/* Middle glow */}
        <div 
          className="absolute -inset-4 rounded-full animate-[pulse_3s_ease-in-out_infinite]"
          style={{
            background: "radial-gradient(circle, rgba(255, 220, 100, 0.6) 0%, rgba(255, 180, 0, 0.3) 50%, transparent 70%)",
            filter: "blur(5px)",
          }}
        />
        {/* Sun core */}
        <div 
          className="w-12 h-12 rounded-full relative"
          style={{
            background: "radial-gradient(circle at 30% 30%, #fff9c4 0%, #ffd54f 30%, #ff9800 70%, #f57c00 100%)",
            boxShadow: "0 0 30px rgba(255, 180, 0, 0.8), 0 0 60px rgba(255, 150, 0, 0.5), 0 0 90px rgba(255, 120, 0, 0.3)",
          }}
        >
          {/* Sun rays */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 w-0.5 h-8 origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                background: "linear-gradient(to top, rgba(255, 200, 50, 0.8), transparent)",
                animation: `sunRayPulse 2s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Sun ray animation keyframes */}
      <style>{`
        @keyframes sunRayPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -100%) rotate(var(--rotation)) scaleY(1); }
          50% { opacity: 1; transform: translate(-50%, -100%) rotate(var(--rotation)) scaleY(1.2); }
        }
      `}</style>
    </div>
  );
};

/**
 * Snowfall effect for Christmas season
 */
export const Snowfall = () => {
  const { showSnow } = useSeasonalEffects();

  if (!showSnow) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: Math.random() * 0.6 + 0.3,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Dashboard snowfall effect (uses emoji snowflakes)
 */
export const DashboardSnowfall = () => {
  const { showSnow } = useSeasonalEffects();

  if (!showSnow) return null;

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

/**
 * Christmas hat overlay for logo
 */
export const ChristmasHat = ({ 
  hatImage, 
  className = "absolute -top-3 -left-1 w-10 h-10 object-contain pointer-events-none z-10 animate-swing origin-bottom" 
}: { 
  hatImage: string; 
  className?: string;
}) => {
  const { showChristmasHat } = useSeasonalEffects();

  if (!showChristmasHat) return null;

  return (
    <img 
      src={hatImage} 
      alt="" 
      className={className}
    />
  );
};

export default { SunEffect, Snowfall, DashboardSnowfall, ChristmasHat };
