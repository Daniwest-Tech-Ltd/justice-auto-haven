import { useEffect, useState } from "react";
import loadingGif from "@/assets/loading-animation.gif";

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
        
        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl font-semibold text-white">Loading...</p>
          <img 
            src={loadingGif} 
            alt="Loading animation" 
            className="h-32 w-32 object-contain"
          />
        </div>
        
        <p className="mt-6 text-lg text-white/90">With you every step of the way</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
