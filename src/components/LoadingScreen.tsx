import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 6 ? "" : prev + "."));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      <div className="text-center">
        <div className="mb-8 flex items-center justify-center gap-2">
          <h1 className="text-5xl font-bold text-white">Justice</h1>
          <span className="inline-block w-24 text-left text-5xl font-bold text-white">
            {dots}
          </span>
        </div>
        
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
        </div>
        
        <p className="mt-6 text-lg text-white/90">Loading your experience</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
