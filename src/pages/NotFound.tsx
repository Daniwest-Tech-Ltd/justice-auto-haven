import { useEffect } from "react";
import { Frown } from "lucide-react";

const NotFound = () => {
  const location = window.location;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-4 font-sans">
      <div className="text-center flex flex-col items-center">
        {/* Sad Face Icon matching the image */}
        <Frown className="w-32 h-32 text-slate-400 mb-6 stroke-[1.5]" />
        
        {/* 404 Text */}
        <h1 className="text-7xl md:text-8xl font-medium text-slate-500 mb-4 tracking-tight">404</h1>

        {/* Page Not Found Text */}
        <h2 className="text-xl md:text-2xl text-slate-500 uppercase tracking-widest font-medium mb-8">
          Page Not Found
        </h2>

        {/* Helper Text */}
        <p className="max-w-md text-sm md:text-base text-slate-400">
          The Page you are looking for doesn't exist or an other error occurred.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
