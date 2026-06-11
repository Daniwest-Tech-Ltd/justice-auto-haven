import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MouseTracker from "./MouseTracker";
import HolidayBanner from "./HolidayBanner";
import { Snowfall } from "./SeasonalEffects";
import heroCar from "@/assets/hero-car.jpg";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen relative">
      <MouseTracker />
      
      {/* Seasonal Snowfall - only shows Nov 1 to Jan 5 */}
      <Snowfall />
      
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
        <div className="pt-20">
          <HolidayBanner />
          <main>{children}</main>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
