import { useEffect, useState } from "react";

interface StockUploadAnimationProps {
  isUploading: boolean;
  isComplete: boolean;
}

const StockUploadAnimation = ({ isUploading, isComplete }: StockUploadAnimationProps) => {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    if (!isUploading && !isComplete) {
      setActiveDot(0);
      return;
    }
    if (isComplete) {
      setActiveDot(6); // all green
      return;
    }
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 350);
    return () => clearInterval(interval);
  }, [isUploading, isComplete]);

  if (!isUploading && !isComplete) return null;

  const dotColors = [
    "hsl(var(--primary))",        // blue
    "hsl(220, 80%, 55%)",         // lighter blue
    "hsl(200, 75%, 50%)",         // cyan-blue
    "hsl(170, 70%, 45%)",         // teal
    "hsl(140, 65%, 45%)",         // green-teal
    "hsl(120, 60%, 45%)",         // green
  ];

  return (
    <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
      {/* Animated dots */}
      <div className="flex items-center gap-2">
        {dotColors.map((color, i) => {
          const isActive = isComplete || i <= activeDot;
          const isCurrent = !isComplete && i === activeDot;
          const finalGreen = "hsl(142, 71%, 45%)";

          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: isCurrent ? 14 : 10,
                height: isCurrent ? 14 : 10,
                backgroundColor: isComplete ? finalGreen : isActive ? color : "hsl(var(--muted))",
                boxShadow: isCurrent
                  ? `0 0 12px ${color}, 0 0 24px ${color}40`
                  : isComplete
                    ? `0 0 8px ${finalGreen}60`
                    : "none",
                animation: isCurrent ? "heartbeat 0.7s ease-in-out infinite" : isComplete ? "heartbeat 1.2s ease-in-out infinite" : "none",
              }}
            />
          );
        })}
      </div>

      {/* Status text */}
      <p
        className="text-sm font-medium transition-colors duration-500"
        style={{
          color: isComplete ? "hsl(142, 71%, 45%)" : "hsl(var(--muted-foreground))",
        }}
      >
        {isComplete ? "✓ Stock updated successfully!" : "Uploading & saving..."}
      </p>

      {/* Inline keyframes */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default StockUploadAnimation;
