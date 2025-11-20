import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Car, Wrench, Package, Search, Calendar, Globe } from "lucide-react";
import { useState } from "react";

const Services = () => {
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  const services = [
    {
      emoji: "🚗",
      title: "Global Car Rentals",
      description: "Affordable, luxury, business-class, and electric vehicle rentals available internationally.",
      extendedDescription: "Fast online booking with local pickup or door-to-door delivery. Available across major cities worldwide with 24/7 support.",
      link: "/catalogue",
    },
    {
      emoji: "🏎️",
      title: "Luxury & Exotic Vehicles",
      description: "Experience the world's most elite vehicles — Lamborghinis, Ferraris, Bentleys, and Rolls-Royces.",
      extendedDescription: "Perfect for events, travel, or VIP occasions. Curated collection of supercars with white-glove service and delivery.",
      link: "/catalogue",
    },
    {
      emoji: "🔧",
      title: "Auto Servicing & Maintenance",
      description: "Advanced vehicle diagnostics, maintenance plans, and servicing performed by certified mechanics.",
      extendedDescription: "AI-powered diagnostic systems ensure precision. Scheduled maintenance, repairs, and emergency support available.",
      link: "https://www.facebook.com/justiceultimatemotors",
    },
    {
      emoji: "📦",
      title: "Auto Parts & Accessories",
      description: "Shop OEM and aftermarket car parts, performance upgrades, wheels, rims, and tech accessories.",
      extendedDescription: "Worldwide delivery with authenticity guarantee. Custom orders and bulk purchasing available.",
      link: "https://www.facebook.com/justiceultimatemotors",
    },
    {
      emoji: "🧠",
      title: "AI-Powered Vehicle Recommendations",
      description: "Get smart recommendations based on your lifestyle, budget, driving habits, and preference.",
      extendedDescription: "Machine learning algorithms analyze your needs to suggest the perfect vehicle match from our global inventory.",
      link: "/catalogue",
    },
    {
      emoji: "📲",
      title: "Smart Vehicle Management",
      description: "Monitor, track, and control your vehicle through the JusticeApp.",
      extendedDescription: "Real-time GPS tracking, fuel analytics, smart alerts, security monitoring, and driver behavior scoring.",
      link: "https://www.facebook.com/justiceultimatemotors",
    },
    {
      emoji: "🌍",
      title: "International Car Export",
      description: "Export vehicles to 60+ countries with full customs support, port clearance, and VIN verification.",
      extendedDescription: "Secure logistics with door-to-port or door-to-door delivery. Complete documentation and compliance handling.",
      link: "/contact",
    },
    {
      emoji: "🛂",
      title: "Sourcing & Importing",
      description: "We locate, inspect, verify, and import vehicles from Japan, UAE, UK, Germany, South Africa.",
      extendedDescription: "Pre-purchase inspections, quality assurance, and transparent pricing. Your trusted import partner.",
      link: "/contact",
    },
    {
      emoji: "⚙️",
      title: "Right-Hand to Left-Hand Conversion",
      description: "Compliant conversions for regions such as Europe, India, USA, South America, and more.",
      extendedDescription: "Factory-grade safety and precision. Full certification and warranty included with every conversion.",
      link: "/contact",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Hero */}
      <section className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-accent bg-clip-text text-transparent">Global Automotive Excellence</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          🚘 From Nairobi to Japan — Justice Ultimate Automobiles delivers world-class car services, international sourcing, export, import, and global logistics.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/catalogue">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline">Visit Showroom</Button>
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section>
        <h2 className="text-4xl font-bold text-center mb-4">Our Premium Services</h2>
        <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
          Discover our diverse range of automotive solutions designed to meet every customer need — from luxury rentals to global logistics and AI-powered tools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="relative h-80 cursor-pointer perspective-1000"
              onMouseEnter={() => setFlippedCard(index)}
              onMouseLeave={() => setFlippedCard(null)}
            >
              {/* Card Container */}
              <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                  flippedCard === index ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 glass-strong rounded-2xl p-8 backface-hidden flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">{service.emoji}</div>
                  <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 glass-strong rounded-2xl p-8 backface-hidden rotate-y-180 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-3">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{service.extendedDescription}</p>
                  </div>
                  <div>
                    {service.link.startsWith("http") ? (
                      <a
                        href={service.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                      >
                        Explore More →
                      </a>
                    ) : (
                      <Link
                        to={service.link}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                      >
                        Explore More →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready for Global Automotive Excellence?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of clients who trust Justice Ultimate Automobiles for reliable, world-class automotive services worldwide.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg">Get Started Today</Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline">Contact Us</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
