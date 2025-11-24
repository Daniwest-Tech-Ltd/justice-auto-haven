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
import ceoImage from "@/assets/ceo.jpg";
import danielImage from "@/assets/daniel-maina.jpg";
import abigaelImage from "@/assets/abigael-muthoni.jpg";
import CertificateModal from "@/components/CertificateModal";

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [heroCars, setHeroCars] = useState<any[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [upcomingCars, setUpcomingCars] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [showCertificate, setShowCertificate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleCard = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    // Fetch featured cars based on is_featured flag
    const { data: featuredData } = await supabase
      .from("cars")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(6);
    if (featuredData) setFeaturedCars(featuredData);

    // Fetch hero cars for slideshow (one from each category)
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

    const heroData = [
      ...(luxury || []),
      ...(suv || []),
      ...(sports || []),
    ];
    setHeroCars(heroData.slice(0, 4));

    // Fetch available cars
    const { data: available } = await supabase
      .from("cars")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(6);
    if (available) setAvailableCars(available);

    // Fetch upcoming cars (recently added)
    const { data: upcoming } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);
    if (upcoming) setUpcomingCars(upcoming);

    // Fetch brands
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
      {/* Hero Section with Slideshow */}
      <section className="relative h-[600px] overflow-hidden" aria-label="Featured Vehicles Showcase">
        <div className="absolute inset-0">
          {heroCars.map((car, index) => (
            <div
              key={car.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
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
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Buy, Rent, or Trade-In Cars in Kenya – <span className="text-transparent bg-clip-text bg-gradient-gold">Justice Ultimate Automobiles</span>
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
                Find Your Car
              </Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate("/trade-in-submission")}>
                 Trade In Your Car
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-secondary/30" aria-label="Car Search">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold">Find Your Dream Car in Kenya Today</h2>
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

      {/* Featured / Priority Cars Section */}
      {featuredCars.length > 0 && (
        <section className="py-16 bg-accent/5" aria-label="Featured Cars">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-2">Featured Cars for Sale in Kenya</h2>
              <p className="text-muted-foreground">Premium quality vehicles - Toyota, Mazda, Nissan, Subaru & more</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map((car) => {
                const imageUrl = getImageUrl(car.images) || getImageUrl(car.main_images);
                return (
                  <Link 
                    key={car.id} 
                    to={`/car/${car.stock_id || car.id}`}
                    className="flip-card h-96 cursor-pointer"
                  >
                    <div className="flip-card-inner">
                      {/* Front */}
                      <div className="flip-card-front relative">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                          <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                            FEATURED
                          </Badge>
                          <h3 className="text-2xl font-bold text-white">{car.make} {car.model}</h3>
                          <p className="text-white/80">{car.year}</p>
                        </div>
                      </div>
                      
                      {/* Back */}
                      <div className="flip-card-back glass-strong flex flex-col justify-between p-6">
                        <div>
                          <h3 className="text-2xl font-bold mb-4">{car.make} {car.model}</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Car className="h-4 w-4 text-accent" />
                              <span>{car.year} • {car.transmission || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Settings className="h-4 w-4 text-accent" />
                              <span>{car.fuel_type || "N/A"} • {car.mileage || "N/A"} km</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Gauge className="h-4 w-4 text-accent" />
                              <span>{car.engine || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="text-3xl font-bold text-accent">
                            KSh {car.price?.toLocaleString()}
                          </div>
                          <Button className="w-full" size="lg">
                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Available Cars Section */}
      <section className="py-16" aria-label="Available Cars">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Quality Used Cars for Sale in Nairobi, Kenya</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableCars.map((car) => (
              <Link 
                key={car.id} 
                to={`/car/${car.stock_id || car.id}`}
                className="flip-card h-96"
              >
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
              View All Available Cars <ArrowRight className="ml-2" />
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
            <Button size="lg" onClick={() => navigate("/trade-in-submission")} className="text-lg">
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
                    <Badge className="absolute top-3 right-3 bg-accent z-10">COMING SOON </Badge>
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
            <div className="flip-card h-80">
              <div className="flip-card-inner">
                <div className="flip-card-front bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <Globe className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Wide Brand Variety</h3>
                  <p className="text-sm text-muted-foreground">
                    Access Toyota, BMW, Mercedes, and more – all verified imports
                  </p>
                </div>
                <div className="flip-card-back bg-gradient-to-br from-primary to-secondary p-6 flex flex-col justify-center text-primary-foreground">
                  <h4 className="text-lg font-bold mb-3">Global Network</h4>
                  <p className="text-sm">
                    We source vehicles from trusted dealers worldwide, ensuring you get 
                    the best selection and quality available in the market.
                  </p>
                </div>
              </div>
            </div>

            <div className="flip-card h-80">
              <div className="flip-card-inner">
                <div className="flip-card-front bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <Users className="h-16 w-16 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2">Trusted by Clients</h3>
                  <p className="text-sm text-muted-foreground">
                    Transparent process and customer-first service
                  </p>
                </div>
                <div className="flip-card-back bg-gradient-to-br from-accent to-primary p-6 flex flex-col justify-center text-primary-foreground">
                  <h4 className="text-lg font-bold mb-3">Customer Satisfaction</h4>
                  <p className="text-sm">
                    Over 5,000+ satisfied customers across Kenya. We prioritize your 
                    experience from browsing to ownership.
                  </p>
                </div>
              </div>
            </div>

            <div className="flip-card h-80">
              <div className="flip-card-inner">
                <div className="flip-card-front bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <DollarSign className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Hire Purchase</h3>
                  <p className="text-sm text-muted-foreground">
                    Flexible payment plans tailored to your needs
                  </p>
                </div>
                <div className="flip-card-back bg-gradient-to-br from-primary to-accent p-6 flex flex-col justify-center text-primary-foreground">
                  <h4 className="text-lg font-bold mb-3">Flexible Financing</h4>
                  <p className="text-sm">
                    We work with major financial institutions to provide you with 
                    affordable payment options that fit your budget.
                  </p>
                </div>
              </div>
            </div>

            <div className="flip-card h-80">
              <div className="flip-card-inner">
                <div className="flip-card-front bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <Shield className="h-16 w-16 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2">Secure & Verified</h3>
                  <p className="text-sm text-muted-foreground">
                    Biometric booking, 2FA logins, and verified car sources
                  </p>
                </div>
                <div className="flip-card-back bg-gradient-to-br from-accent to-secondary p-6 flex flex-col justify-center text-primary-foreground">
                  <h4 className="text-lg font-bold mb-3">Security First</h4>
                  <p className="text-sm">
                    Your data and transactions are protected with enterprise-grade 
                    security. Every vehicle is thoroughly verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold">Meet the Team Behind Justice Ultimate Automobiles</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our dedicated leadership team brings transparency, expertise, and world-class customer service to every interaction.
            </p>
            <p className="text-sm text-muted-foreground">
              We are fully certified and authorized to operate as a professional automotive dealer in Kenya.
            </p>
          </div>
          
          {/* Team Flip Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            
            {/* CEO Card */}
            <div className="relative h-96 perspective-1000">
              <div 
                className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                  flippedCards['ceo'] ? 'rotate-y-180' : ''
                }`}
                onClick={() => toggleCard('ceo')}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-primary/30">
                  <img
                    src={ceoImage}
                    alt="Justice Vincent - CEO"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2">Justice Vincent</h3>
                  <p className="text-sm text-primary font-semibold mb-2">Chief Executive Officer</p>
                  <p className="text-xs text-muted-foreground"> Kenya / Global Operations</p>
                  <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-between border-2 border-primary/30">
                  <div>
                    <h3 className="text-lg font-bold mb-3">Justice Vincent</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Justice Vincent leads Justice Ultimate Automobiles with a passion for excellence, transparency, and global automotive sourcing. 
                      His dedication to customer satisfaction has transformed the company into a trusted brand across Kenya and beyond.
                    </p>
                    <p className="text-xs italic text-muted-foreground mb-4">
                      "Committed to delivering vehicles across continents—safely, transparently and professionally."
                    </p>
                  </div>
                  <div className="space-y-2">
                    <a 
                      href="https://wa.me/254722827458" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      WhatsApp: 0722 827 458
                    </a>
                    <a 
                      href="mailto:justicevincentt@gmail.com" 
                      className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-4 rounded-lg text-center transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* System Admin Card */}
            <div className="relative h-96 perspective-1000">
              <div 
                className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                  flippedCards['admin'] ? 'rotate-y-180' : ''
                }`}
                onClick={() => toggleCard('admin')}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-primary/30">
                  <img
                    src={danielImage}
                    alt="Daniel Maina W. - System Administrator"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2">Daniel Maina W.</h3>
                  <p className="text-sm text-primary font-semibold mb-2">System Administrator</p>
                  <p className="text-xs text-muted-foreground italic">Secure Systems, Seamless Operations</p>
                  <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-between border-2 border-primary/30">
                  <div>
                    <h3 className="text-lg font-bold mb-3">Daniel Maina W.</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Daniel ensures the digital infrastructure, security, and technology systems of Justice Ultimate Automobiles run smoothly. 
                      He oversees automation, digital platforms, and customer support systems.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p className="mb-1">🛡 Expertise:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>System Security & DevOps</li>
                        <li>AI Integrations</li>
                        <li>Web Development</li>
                        <li>Technical Support</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <a 
                      href="https://wa.me/254701460110" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      WhatsApp: 0701460110
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Executive Card - Abigael M. */}
            <div className="relative h-96 perspective-1000">
              <div 
                className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                  flippedCards['sales'] ? 'rotate-y-180' : ''
                }`}
                onClick={() => toggleCard('sales')}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-primary/30">
                  <img
                    src={abigaelImage}
                    alt="Abigael M. - Sales Executive"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2">Abigael M.</h3>
                  <p className="text-sm text-primary font-semibold mb-2">Senior Sales Executive</p>
                  <p className="text-xs text-muted-foreground italic">Digital Marketing Specialist</p>
                  <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-between border-2 border-primary/30">
                  <div>
                    <h3 className="text-lg font-bold mb-3">Abigael M.</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Abigael leads our sales and digital marketing initiatives, ensuring customers receive personalized service 
                      and expert guidance throughout their car buying journey. Her passion for customer satisfaction drives our online presence.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p className="mb-1">✨ Specialties:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Customer Relations</li>
                        <li>Digital Marketing</li>
                        <li>Sales Strategy</li>
                        <li>Social Media Management</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                   <a href="mailto:sales@justiceultimateautomobiles.com?subject=Inquiry%20from%20Customer&body=Hello%20team%2C%0A%0AI%20would%20like%20to%20inquire%20about...">
  <button 
    className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-2 px-4 rounded-lg text-center transition-colors"
    onClick={(e) => e.stopPropagation()}
  >
    Contact Sales
  </button>
</a>
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Information Tiles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            
            {/* Company Certification Tile */}
            <div className="glass-strong rounded-2xl p-6 border-2 border-accent/50 bg-gradient-to-br from-accent/10 to-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-8 w-8 text-accent" />
                <h3 className="text-lg font-bold">Certified Dealer</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Justice Ultimate Automobiles is officially recognized as a Qualified Automotive Industry Partner in Kenya.
              </p>
              <div className="text-xs text-muted-foreground space-y-1 mb-4">
                <p>📜 Certificate No: ULT-KE-2025-2581</p>
                <p>📅 Issued: 2025-11-21</p>
                <p>🏛 Authority: HARAMBEE - Republic of Kenya</p>
              </div>
              <Button
                onClick={() => setShowCertificate(true)}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm"
              >
                View Certificate
              </Button>
            </div>

            {/* Safe Payment Policy Tile */}
            <div className="glass-strong rounded-2xl p-6 border-2 border-primary/50">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">Safe Payment</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                To protect our clients from fraud:
              </p>
              <div className="text-xs text-muted-foreground space-y-2 mb-4">
                <p>✔ NO online payments allowed</p>
                <p>✔ Visit our yard physically</p>
                <p>✔ Cash, M-Pesa, Bank Transfer</p>
                <p>✔ Lipa Mdogo Mdogo available</p>
              </div>
              <div className="text-xs font-semibold text-primary">
                📍 Mpesi Lane 11, Westlands, Nairobi
              </div>
            </div>

            {/* Car Purchase Process Tile */}
            <div className="glass-strong rounded-2xl p-6 border-2 border-primary/50">
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-8 w-8 text-primary" />
                <h3 className="text-lg font-bold">How to Purchase</h3>
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>1️⃣ Visit Our Yard</p>
                <p>2️⃣ Vehicle Assessment</p>
                <p>3️⃣ Test Drive</p>
                <p>4️⃣ Payment & Agreement</p>
                <p>5️⃣ Ownership Transfer (NTSA)</p>
                <p>6️⃣ Logbook Processing (7-21 days)</p>
                <p>7️⃣ Car Release with Documents</p>
              </div>
              <Button 
                size="sm" 
                className="w-full mt-4"
                onClick={() => navigate("/catalogue")}
              >
                View Inventory
              </Button>
            </div>

            {/* After-Sales Support Tile */}
            <div className="glass-strong rounded-2xl p-6 border-2 border-accent/50">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-8 w-8 text-accent" />
                <h3 className="text-lg font-bold">After-Sales</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                We provide comprehensive support:
              </p>
              <div className="text-xs text-muted-foreground space-y-2 mb-4">
                <p>✔ 7-day mechanical check guarantee</p>
                <p>✔ Road assistance on request</p>
                <p>✔ Free servicing guidance</p>
                <p>✔ Spare parts supplier access</p>
              </div>
              <a 
                href="https://wa.me/254722827458"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors"
              >
                📞 Support: 0722827458
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Summary Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Get in Touch</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Globe className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Location</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => window.open("https://maps.app.goo.gl/sruXcwwRpCAZrg6i8", "_blank")}
                    >
                      <div className="text-sm">
                        Mpesi Lane 11, Westlands, Nairobi, Kenya
                      </div>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Phone</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => window.open("tel:+254722827458")}
                    >
                      +254722827458
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Globe className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Email</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => window.open("mailto:justicevincentt@gmail.com")}
                    >
                      justicevincentt@gmail.com
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Website</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => window.open("https://www.justiceultimateautomobiles.com", "_blank")}
                    >
                      www.justiceultimateautomobiles.com
                    </Button>
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

      {/* Certificate Modal */}
      <CertificateModal open={showCertificate} onOpenChange={setShowCertificate} />
    </div>
  );
};

export default Home;
