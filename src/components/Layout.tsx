import { ReactNode, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MouseTracker from "./MouseTracker";
import heroCar from "@/assets/hero-car.jpg";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Add snowfall effect
  useEffect(() => {
    const snowflakes = 50;
    const container = document.body;
    
    for (let i = 0; i < snowflakes; i++) {
      const flake = document.createElement("div");
      flake.className = "snowflake";
      flake.style.left = Math.random() * 100 + "vw";
      flake.style.animationDuration = 2 + Math.random() * 3 + "s";
      flake.style.animationDelay = Math.random() * 3 + "s";
      flake.style.opacity = (Math.random() * 0.6 + 0.3).toString();
      container.appendChild(flake);
    }

    return () => {
      // Cleanup snowflakes on unmount
      const flakes = document.querySelectorAll(".snowflake");
      flakes.forEach(flake => flake.remove());
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      <MouseTracker />
      
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${heroCar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-background/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
