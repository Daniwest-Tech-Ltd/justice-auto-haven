import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Shield, Globe, Zap, Award, Users, Search, 
  TrendingUp, CheckCircle, Heart, ArrowRight, Star,
  Clock, DollarSign, Settings, Phone, Gauge
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BrandMarquee from "@/components/BrandMarquee";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [heroCars, setHeroCars] = useState<any[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [upcomingCars, setUpcomingCars] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    // Featured cars
    const { data: featuredData } = await supabase
      .from("cars")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(6);
    if (featuredData) setFeaturedCars(featuredData);

    // Hero cars for slideshow
    const { data: luxury } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "available")
      .ilike("make", "%Mercedes%")
      .limit(1);
    
    const { data: suv } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "available")
      .or("make.ilike.%Toyota%,make.ilike.%Land Rover%")
      .limit(1);
    
    const { data: sports } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "available")
      .or("make.ilike.%BMW%,make.ilike.%Range Rover%")
      .limit(1);

    const heroData = [...(luxury || []), ...(suv || []), ...(sports || [])];
    setHeroCars(heroData.slice(0, 4));

    // Available cars
    const { data: available } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(6);
    if (available) setAvailableCars(available);

    // Upcoming cars
    const { data: upcoming } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);
    if (upcoming) setUpcomingCars(upcoming);

    // Brands
    const { data: brandsData } = await supabase
      .from("brands")
      .select("*")
      .order("name");
    if (brandsData) setBrands(brandsData);
  };

  const handleSearch = () => {
    if (searchQuery.trim() || selectedBrand) {
      navigate(`/catalogue?search=${searchQuery}&brand=${selectedBrand}`);
    } else {
      toast({
        title: "Search Required",
        description: "Please enter a search term or select a brand",
        variant: "destructive"
      });
    }
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Featured Cars Section */}
      {featuredCars.length > 0 && (
        <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-8 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-8 w-8 text-accent fill-accent" />
              <h2 className="text-3xl font-bold text-foreground">Featured Today</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCars.map((car) => (
                <Link key={car.id} to={`/car/${car.stock_id || car.id}`} className="flip-card h-80">
                  <div className="flip-card-inner">
                    <div className="flip-card-front bg-card border border-border rounded-xl overflow-hidden">
                      <div className="h-48">
                        {getImageUrl(car.images) ? (
                          <img
                            src={getImageUrl(car.images)}
                            alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Car className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <Badge className="bg-accent text-accent-foreground mb-2">⭐ Featured</Badge>
                        <h3 className="text-xl font-bold">{car.make} {car.model}</h3>
                        <p className="text-2xl text-primary font-bold mt-2">
                          KSh {car.price?.toLocaleString() || 'N/A'}
                        </p>
                        <Button className="w-full mt-3" size="sm">
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flip-card-back bg-gradient-to-br from-primary to-accent p-6 flex flex-col justify-center items-center text-center text-primary-foreground">
                      <CheckCircle className="h-12 w-12 mb-4" />
                      <h4 className="text-xl font-bold mb-3">Why Choose Justice?</h4>
                      <ul className="text-sm space-y-2 text-left">
                        <li>✓ Verified & Inspected</li>
                        <li>✓ Flexible Payment Plans</li>
                        <li>✓ Premium Customer Service</li>
                        <li>✓ Trusted Across Kenya</li>
                      </ul>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          {heroCars.map((car, index) => (
            <div
              key={car.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
            >
              {getImageUrl(car.images) && (
                <img
                  src={getImageUrl(car.images)}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/40" />
            </div>
          ))}
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-gold">
                Justice Ultimate Automobiles
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Your Trusted Car Masters... with you every step of the way
            </p>
            <p className="text-lg">
              Drive your dream today with Kenya's most trusted source for premium cars, 
              imports, and future-ready automotive technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="text-lg" onClick={() => navigate("/catalogue")}>
                🔍 Find Your Car
              </Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate("/trade-in")}>
                🧾 Trade In Your Car
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold">Find Your Dream Car</h2>
              <p className="text-muted-foreground">
                Try "Toyota Harrier Hybrid under 100k km" or use filters below
              </p>
            </div>
            <div className="grid md:grid-cols-6 gap-4">
              <div className="md:col-span-3">
                <Input
                  placeholder="Search by make, model, or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12"
                />
              </div>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} size="lg" className="h-12">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Available Cars Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Available Cars in Our Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableCars.map((car) => (
              <Link key={car.id} to={`/car/${car.stock_id || car.id}`} className="flip-card h-96">
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-56">
                      {getImageUrl(car.images) ? (
                        <img
                          src={getImageUrl(car.images)}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-xl font-bold">{car.make} {car.model} {car.year}</h3>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>{car.mileage || "N/A"}</div>
                        <div>{car.fuel_type || "N/A"}</div>
                        <div>{car.transmission || "N/A"}</div>
                      </div>
                      <p className="text-2xl text-primary font-bold">
                        KSh {car.price?.toLocaleString() || 'N/A'}
                      </p>
                      <Button className="w-full" size="sm">
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flip-card-back bg-gradient-to-br from-primary to-secondary p-6 flex flex-col justify-center text-center text-primary-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <h4 className="text-xl font-bold mb-3">Premium Quality Guaranteed</h4>
                    <ul className="text-sm space-y-2">
                      <li>✓ Full Vehicle History</li>
                      <li>✓ Professional Inspection</li>
                      <li>✓ Warranty Available</li>
                      <li>✓ After-Sales Support</li>
                    </ul>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" onClick={() => navigate("/catalogue")}>
              🚗 View All Available Cars <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trade-In Section */}
      <section className="py-16 bg-gradient-to-r from-primary/20 to-accent/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Want to Upgrade?</h2>
            <p className="text-lg text-muted-foreground">
              Trade in your current car for a newer model with ease. We evaluate fairly 
              and offer same-day exchange options.
            </p>
            <Button size="lg" onClick={() => navigate("/trade-in")} className="text-lg">
              Trade In Now <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Cars Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Upcoming Cars</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {upcomingCars.map((car) => (
              <div key={car.id} className="flip-card h-80">
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-card border border-border rounded-xl overflow-hidden relative">
                    <Badge className="absolute top-3 right-3 bg-accent z-10">COMING SOON 🚚</Badge>
                    <div className="h-48">
                      {getImageUrl(car.images) ? (
                        <img
                          src={getImageUrl(car.images)}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover opacity-70"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold">{car.make} {car.model}</h3>
                      <p className="text-muted-foreground text-sm">{car.year}</p>
                    </div>
                  </div>
                  <div className="flip-card-back bg-gradient-to-br from-accent to-primary p-6 flex flex-col justify-center text-center text-primary-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <h4 className="text-lg font-bold mb-2">Available Soon</h4>
                    <p className="text-sm">Be the first to know when this arrives in our showroom!</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose Justice Ultimate Automobiles?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Globe, title: "Wide Brand Variety", desc: "Access Toyota, BMW, Mercedes, and more – all verified imports", backTitle: "Global Network", backDesc: "We source vehicles from trusted dealers worldwide, ensuring you get the best selection and quality available in the market." },
              { icon: Users, title: "Trusted by Clients", desc: "Transparent process and customer-first service", backTitle: "Customer Satisfaction", backDesc: "Over 5,000+ satisfied customers across Kenya. We prioritize your experience from browsing to ownership." },
              { icon: DollarSign, title: "Hire Purchase", desc: "Flexible payment plans tailored to your needs", backTitle: "Flexible Financing", backDesc: "We work with major financial institutions to provide you with affordable payment options that fit your budget." },
              { icon: Shield, title: "Secure & Verified", desc: "Biometric booking, 2FA logins, and verified car sources", backTitle: "Security First", backDesc: "Your data and transactions are protected with enterprise-grade security. Every vehicle is thoroughly verified." }
            ].map((item, idx) => (
              <div key={idx} className="flip-card h-80">
                <div className="flip-card-inner">
                  <div className="flip-card-front bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <item.icon className="h-16 w-16 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="flip-card-back bg-gradient-to-br from-primary to-secondary p-6 flex flex-col justify-center text-primary-foreground">
                    <h4 className="text-lg font-bold mb-3">{item.backTitle}</h4>
                    <p className="text-sm">{item.backDesc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Mwangi", location: "Nairobi, Kenya", review: "Outstanding service! Justice Ultimate Automobiles helped me find the perfect Land Rover. The process was smooth, transparent, and professional from start to finish." },
              { name: "James Kamau", location: "Mombasa, Kenya", review: "Best car dealership in Kenya! Got my Toyota Harrier at a great price with flexible payment options. The team is knowledgeable and genuinely cares about customer satisfaction." },
              { name: "Grace Achieng", location: "Kisumu, Kenya", review: "Traded in my old car and upgraded to a BMW X5. The valuation was fair, and the entire exchange process was completed in one day. Highly recommended!" }
            ].map((item, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">{item.review}</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Get in Touch</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-sm text-muted-foreground">Mpesi Lane 11, Westlands, Nairobi, Kenya</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-sm text-muted-foreground">+254 722 827 458</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-sm text-muted-foreground">justicevincentt@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Website</p>
                    <p className="text-sm text-muted-foreground">www.justice-ultimate-automobiles.co.ke</p>
                  </div>
                </div>
              </div>
            </div>
            <Button size="lg" onClick={() => navigate("/contact")}>
              Contact Us <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
