import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import heroCar from "@/assets/hero-car.jpg";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen relative">
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
        <main className="pt-20">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
