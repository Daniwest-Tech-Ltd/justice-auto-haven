import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Car, Wrench, Package, Building2, Calendar, Search } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: <Car className="h-12 w-12" />,
      emoji: "🚗",
      title: "Global Car Rentals",
      description: "Affordable, luxury, and electric vehicle rentals available across all continents. Seamless online booking with local pickup or delivery.",
    },
    {
      icon: <Car className="h-12 w-12" />,
      emoji: "🏎️",
      title: "Luxury & Exotic Vehicles",
      description: "Drive the world's finest supercars, from Lamborghinis to Rolls-Royces. Curated for special occasions and elite experiences.",
    },
    {
      icon: <Wrench className="h-12 w-12" />,
      emoji: "🔧",
      title: "Auto Servicing & Maintenance",
      description: "Top-tier vehicle diagnostics, maintenance plans, and servicing from certified mechanics and AI-powered tools.",
    },
    {
      icon: <Package className="h-12 w-12" />,
      emoji: "📦",
      title: "Auto Parts & Accessories",
      description: "Order OEM and aftermarket car parts, custom rims, performance upgrades, and tech accessories with global shipping.",
    },
    {
      icon: <Search className="h-12 w-12" />,
      emoji: "🧠",
      title: "AI-Powered Vehicle Recommendations",
      description: "Get intelligent car suggestions based on your preferences, driving habits, and budget powered by machine learning.",
    },
    {
      icon: <Calendar className="h-12 w-12" />,
      emoji: "📲",
      title: "Smart Vehicle Management",
      description: "Control, track, and schedule your vehicle via the JusticeApp. Real-time GPS, fuel analytics, and driver behavior tracking.",
    },
    {
      icon: <Package className="h-12 w-12" />,
      emoji: "🌍",
      title: "International Car Export",
      description: "Export vehicles to 60+ countries with customs handling, VIN checks, and port-to-port logistics.",
    },
    {
      icon: <Search className="h-12 w-12" />,
      emoji: "🛂",
      title: "Sourcing & Importing",
      description: "We locate, inspect, and import cars based on your exact specs from Japan, UAE, Germany, UK, and more.",
    },
    {
      icon: <Wrench className="h-12 w-12" />,
      emoji: "⚙️",
      title: "Right-Hand to Left-Hand Conversion",
      description: "Compliant conversions for markets like Europe, India, and the Americas.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Hero */}
      <section className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-accent bg-clip-text text-transparent">Global Automotive Services</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          🚘 From Nairobi to New York — Justice Ultimate Automobiles provides expert car services, international sourcing, export, import, and logistics.
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
        <h2 className="text-4xl font-bold text-center mb-12">Our Premium Services</h2>
        <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
          Discover our comprehensive range of automotive services designed to meet your every need, from luxury rentals to international logistics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="glass-strong rounded-2xl p-8 hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-4">{service.emoji}</div>
              <h3 className="text-xl font-bold mb-4">{service.title}</h3>
              <p className="text-muted-foreground mb-6">{service.description}</p>
              <Link to="/contact" className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2">
                Explore More →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Experience Premium Automotive Services?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust Justice Ultimate Automobiles for their automotive needs worldwide.
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
