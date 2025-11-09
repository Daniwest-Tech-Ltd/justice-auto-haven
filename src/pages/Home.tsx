import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Shield, Globe, Zap, Award, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [featuredCar, setFeaturedCar] = useState<any>(null);

  useEffect(() => {
    fetchFeaturedCar();
  }, []);

  const fetchFeaturedCar = async () => {
    try {
      const { data, error } = await supabase
        .from("featured_cars")
        .select(`
          *,
          cars (*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setFeaturedCar(data.cars);
      }
    } catch (error) {
      console.error("Error fetching featured car:", error);
    }
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-20">
        <div className="glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Welcome to Justice
            </span>
            <br />
            <span className="text-foreground">Ultimate Automobiles</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Drive Your Dream Today
          </p>
          <p className="text-lg text-foreground/90 max-w-3xl mx-auto mb-8">
            🚗 Welcome to the future of automotive excellence! Experience premium vehicle solutions
            from luxury car rentals to smart, secure bookings across all continents. Your journey
            starts here with Justice Ultimate Automobiles.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/catalogue">
              <Button size="lg" className="text-lg px-8">
                Explore Cars
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Today */}
      {featuredCar && (
        <section className="glass-strong rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Featured Today
              </span>
            </h2>
          </div>
          
          <Link to={`/car/${featuredCar.stock_id || featuredCar.id}`}>
            <div className="grid md:grid-cols-2 gap-8 items-center hover:scale-[1.02] transition-transform">
              <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                {getImageUrl(featuredCar.images) ? (
                  <img
                    src={getImageUrl(featuredCar.images)}
                    alt={`${featuredCar.make} ${featuredCar.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">{featuredCar.make.charAt(0)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <Badge className="bg-yellow-600">⭐ Featured Today</Badge>
                <h3 className="text-3xl font-bold">
                  {featuredCar.make} {featuredCar.model}
                </h3>
                <p className="text-2xl text-primary font-bold">
                  KSh {featuredCar.price.toLocaleString()}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><strong>Year:</strong> {featuredCar.year}</div>
                  <div><strong>Fuel:</strong> {featuredCar.fuel_type || "N/A"}</div>
                  <div><strong>Transmission:</strong> {featuredCar.transmission || "N/A"}</div>
                  <div><strong>Mileage:</strong> {featuredCar.mileage || "N/A"}</div>
                </div>
                <Button size="lg" className="w-full md:w-auto">
                  View Details →
                </Button>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Us?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We redefine excellence in the global automotive space by offering futuristic car
            leasing, intelligent recommendations, secure booking with biometric verification, and
            carbon-neutral delivery solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-strong rounded-2xl p-8 text-center hover:scale-105 transition-transform">
            <Globe className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">🌍 Global Reach</h3>
            <p className="text-muted-foreground">
              Serving customers across Africa, Europe, Asia, and the Americas with seamless online
              booking.
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-8 text-center hover:scale-105 transition-transform">
            <Shield className="h-16 w-16 text-accent mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">🔐 Security First</h3>
            <p className="text-muted-foreground">
              Encrypted transactions, 2FA login, and verified vendor listings to keep your data and
              choices safe.
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-8 text-center hover:scale-105 transition-transform">
            <Car className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">🚘 Premium Fleet</h3>
            <p className="text-muted-foreground">
              Access luxury cars, electric vehicles, commercial vans, and rare vintage collections
              all in one platform.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Drive into the Future?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands globally who rely on Justice Ultimate Automobiles for reliability, luxury,
          and innovation.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8">
              Join Now
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="space-y-12">
        <h2 className="text-4xl md:text-5xl font-bold text-center">Explore Our Expertise</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Car className="h-8 w-8" />,
              title: "🚗 Luxury Car Rentals",
              desc: "Choose from our fleet of high-end cars for business or leisure travel.",
            },
            {
              icon: <Zap className="h-8 w-8" />,
              title: "🛠️ Auto Servicing & Repair",
              desc: "Certified technicians offering routine maintenance and diagnostics.",
            },
            {
              icon: <Globe className="h-8 w-8" />,
              title: "📦 Vehicle Delivery & Logistics",
              desc: "We handle global shipping and secure delivery of all vehicle types.",
            },
            {
              icon: <Users className="h-8 w-8" />,
              title: "💼 Corporate Fleet Management",
              desc: "Custom solutions for businesses needing efficient vehicle oversight.",
            },
            {
              icon: <Award className="h-8 w-8" />,
              title: "📝 Smart Car Booking",
              desc: "Use our intelligent booking system with real-time availability and support.",
            },
            {
              icon: <Shield className="h-8 w-8" />,
              title: "🔍 Vehicle Inspection & History",
              desc: "Detailed reports and checks before every sale to ensure quality.",
            },
          ].map((service, idx) => (
            <div
              key={idx}
              className="glass-strong rounded-2xl p-8 hover:scale-105 transition-transform"
            >
              <div className="text-primary mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-4">{service.desc}</p>
              <Link
                to="/services"
                className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2"
              >
                Learn More →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
