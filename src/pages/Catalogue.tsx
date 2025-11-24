import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Phone, Mail, MessageCircle, Car, Gauge, Settings as SettingsIcon, Heart, Shield, MapPin, Clock, CreditCard } from "lucide-react";
import { PaymentMethodsModal } from "@/components/PaymentMethodsModal";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fuel_type: string | null;
  transmission: string | null;
  mileage: string | null;
  status: string | null;
  color: string | null;
  engine: string | null;
  images: any;
  stock_id: string | null;
  is_featured: boolean | null;
}

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

const Catalogue = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    brand: searchParams.get("brand") || "all",
    year: "all",
    availability: "all",
    fuelType: "all",
    priceRange: "all",
  });
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const itemsPerPage = 12;

  // Fetch brands with React Query
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch wishlist with React Query
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (user) {
        const { data } = await supabase
          .from("wishlist")
          .select("car_id")
          .eq("user_id", user.id);
        return data?.map(w => w.car_id) || [];
      }
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    },
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (wishlistData) {
      setWishlist(wishlistData);
    }
  }, [wishlistData]);

  // Build optimized query
  const buildCarsQuery = () => {
    let query = supabase
      .from("cars")
      .select("*", { count: 'exact' });

    // Apply filters at database level
    if (searchQuery) {
      query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,year.eq.${searchQuery}`);
    }

    if (filters.brand !== "all") {
      query = query.eq("make", filters.brand);
    }

    if (filters.year !== "all") {
      query = query.eq("year", parseInt(filters.year));
    }

    if (filters.availability !== "all") {
      query = query.eq("status", filters.availability);
    }

    if (filters.fuelType !== "all") {
      query = query.eq("fuel_type", filters.fuelType);
    }

    if (filters.priceRange !== "all") {
      const [min, max] = filters.priceRange.split("-").map(Number);
      if (max) {
        query = query.gte("price", min).lte("price", max);
      } else {
        query = query.gte("price", min);
      }
    }

    if (stockFilter === "in-stock") {
      query = query.neq("status", "sold");
    } else if (stockFilter === "sold-out") {
      query = query.eq("status", "sold");
    }

    return query;
  };

  // Fetch cars with React Query and server-side pagination
  const { data: carsData, isLoading } = useQuery({
    queryKey: ['cars', searchQuery, filters, stockFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await buildCarsQuery()
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        cars: data || [],
        total: count || 0,
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const cars = carsData?.cars || [];
  const totalPages = Math.ceil((carsData?.total || 0) / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, stockFilter]);

  // Check for brand filter from URL
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    if (brandParam) {
      setFilters(prev => ({ ...prev, brand: brandParam }));
    }
  }, [searchParams]);


  const toggleWishlist = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (wishlist.includes(carId)) {
        if (user) {
          await supabase
            .from("wishlist")
            .delete()
            .eq("user_id", user.id)
            .eq("car_id", carId);
        } else {
          const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
          localStorage.setItem("wishlist", JSON.stringify(local.filter((id: string) => id !== carId)));
        }
        setWishlist(wishlist.filter(id => id !== carId));
        toast({ title: "Removed from whitelist" });
      } else {
        if (user) {
          await supabase
            .from("wishlist")
            .insert({ user_id: user.id, car_id: carId });
        } else {
          const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
          localStorage.setItem("wishlist", JSON.stringify([...local, carId]));
        }
        setWishlist([...wishlist, carId]);
        toast({ title: "Added to whitelist" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      brand: "all",
      year: "all",
      availability: "all",
      fuelType: "all",
      priceRange: "all",
    });
    setStockFilter("all");
    setCurrentPage(1);
  };

  const getImages = (car: any): string[] => {
    // Try new image structure first (main_images)
    if (car.main_images) {
      if (Array.isArray(car.main_images) && car.main_images.length > 0) {
        return car.main_images;
      }
      if (typeof car.main_images === 'string') {
        try {
          const parsed = JSON.parse(car.main_images);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }

    // Fallback to old images field
    if (car.images) {
      if (Array.isArray(car.images)) return car.images;
      if (typeof car.images === 'string') {
        try {
          const parsed = JSON.parse(car.images);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [car.images];
        }
      }
    }
    
    return [];
  };

  const getBrandLogo = (make: string) => {
    const brand = brands.find(b => b.name.toLowerCase() === make.toLowerCase());
    return brand?.logo_url;
  };

  // Fetch filter options separately (cached)
  const { data: filterOptions } = useQuery({
    queryKey: ['car-filter-options'],
    queryFn: async () => {
      const { data } = await supabase
        .from("cars")
        .select("year, make, fuel_type");
      
      const uniqueYears = Array.from(new Set(data?.map((car) => car.year) || []))
        .filter(Boolean)
        .sort((a, b) => b - a);
      
      const uniqueMakes = Array.from(new Set(data?.map((car) => car.make).filter(make => make && make.trim() !== '') || []))
        .sort();
      
      const uniqueFuelTypes = Array.from(new Set(data?.map((car) => car.fuel_type).filter(type => type && type.trim() !== '') || []))
        .sort();

      return { uniqueYears, uniqueMakes, uniqueFuelTypes };
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const uniqueYears = filterOptions?.uniqueYears || [];
  const uniqueMakes = filterOptions?.uniqueMakes || [];
  const uniqueFuelTypes = filterOptions?.uniqueFuelTypes || [];

  if (isLoading && !carsData) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-8 mb-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-end gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/trade-in-submission')}
              className="font-semibold"
            >
              TRADE IN
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/rental-catalogue')}
              className="font-semibold"
            >
              RENT
            </Button>
          </div>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-accent bg-clip-text text-transparent">
              Cars for Sale in Kenya | Affordable & Verified Vehicles
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-3">
              Best Car Dealership in Nairobi, Kenya - Toyota, Mazda, Nissan, Subaru & More
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              Quality, Verified, and Ready for Delivery • Lipa Mdogo Mdogo Available
            </p>
            
            {/* Contact Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-5">
              <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer">
                <Button size="default" className="gap-2 bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp: 0722 827 458
                </Button>
              </a>
              <a href="tel:+254722827458">
                <Button size="default" variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              <div className="glass-strong rounded-lg p-3 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-xs">Verified Vehicles</p>
                  <p className="text-xs text-muted-foreground">100% Quality Assured</p>
                </div>
              </div>
              <a href="https://maps.app.goo.gl/92DgyWn62UNSR26p8" target="_blank" rel="noopener noreferrer" className="block">
                <div className="glass-strong rounded-lg p-3 flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold text-xs">Visit Our Yard</p>
                    <p className="text-xs text-muted-foreground">Mpesi Lane, Westlands</p>
                  </div>
                </div>
              </a>
              <div className="glass-strong rounded-lg p-3 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-xs">Quick Processing</p>
                  <p className="text-xs text-muted-foreground">7-21 Days Logbook</p>
                </div>
              </div>
              <button 
                onClick={() => setPaymentModalOpen(true)}
                className="glass-strong rounded-lg p-3 flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer w-full"
              >
                <CreditCard className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-xs">Lipa Mdogo Mdogo</p>
                  <p className="text-xs text-muted-foreground">Flexible Payment Plans</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">

        {/* Search and Filters */}
        <div className="glass-strong rounded-lg p-4 mb-6">
          {/* Stock Status Filter Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              variant={stockFilter === "all" ? "default" : "outline"}
              onClick={() => setStockFilter("all")}
              className="flex-1"
            >
              All Vehicles
            </Button>
            <Button
              variant={stockFilter === "in-stock" ? "default" : "outline"}
              onClick={() => setStockFilter("in-stock")}
              className={`flex-1 ${
                stockFilter === "in-stock"
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                  : "border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              }`}
            >
              In Stock
            </Button>
            <Button
              variant={stockFilter === "sold-out" ? "default" : "outline"}
              onClick={() => setStockFilter("sold-out")}
              className={`flex-1 ${
                stockFilter === "sold-out"
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                  : "border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              }`}
            >
              Sold Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, or year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.brand} onValueChange={(value) => setFilters({ ...filters, brand: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {uniqueMakes.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.fuelType} onValueChange={(value) => setFilters({ ...filters, fuelType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel Types</SelectItem>
                {uniqueFuelTypes.map((type) => (
                  <SelectItem key={type} value={type!}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priceRange} onValueChange={(value) => setFilters({ ...filters, priceRange: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-1000000">Under 1M</SelectItem>
                <SelectItem value="1000000-3000000">1M - 3M</SelectItem>
                <SelectItem value="3000000-5000000">3M - 5M</SelectItem>
                <SelectItem value="5000000-10000000">5M - 10M</SelectItem>
                <SelectItem value="10000000">10M+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || filters.brand !== "all" || filters.year !== "all" || filters.fuelType !== "all" || filters.priceRange !== "all" || stockFilter !== "all") && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {carsData?.total || 0} vehicles
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Cars Grid */}
        {cars.length === 0 ? (
          <div className="glass-strong rounded-lg p-12 text-center">
            <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search criteria
            </p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => {
                const images = getImages(car);
                const brandLogo = getBrandLogo(car.make);
                
                return (
                  <div
                    key={car.id}
                    className="glass-strong rounded-xl overflow-hidden flex flex-col border border-primary/20 hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/10"
                  >
                    <Link to={`/car/${car.stock_id || car.id}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={images[0] || "/placeholder.svg"}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-3 left-3 bg-primary shadow-lg">
                          {car.year}
                        </Badge>
                        
                        {/* Stock Status Badge - Top Right */}
                        <div className="absolute top-3 right-3 z-10">
                          {car.status === "sold" ? (
                            <Badge className="bg-red-600 hover:bg-red-600 text-white px-3 py-1 shadow-lg">
                              SOLD OUT
                            </Badge>
                          ) : (
                            <Badge className="bg-green-600 hover:bg-green-600 text-white px-3 py-1 shadow-lg">
                              ✓ IN STOCK
                            </Badge>
                          )}
                        </div>

                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute bottom-3 right-3 z-10 shadow-lg"
                          onClick={(e) => toggleWishlist(e, car.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              wishlist.includes(car.id) ? "fill-red-500 text-red-500" : ""
                            }`}
                          />
                        </Button>
                        {brandLogo && (
                          <div className="absolute bottom-3 left-3 bg-white/90 rounded p-1.5 shadow-lg">
                            <img src={brandLogo} alt={car.make} className="h-6 w-auto object-contain" />
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <Link to={`/car/${car.stock_id || car.id}`}>
                        <h3 className="font-bold text-xl mb-2 line-clamp-1 hover:text-primary transition-colors">
                          {car.make} {car.model}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-3">
                        Stock ID: <span className="font-mono font-semibold">{car.stock_id || "N/A"}</span>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Gauge className="h-4 w-4 text-primary" />
                          <span>{car.mileage || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <SettingsIcon className="h-4 w-4 text-primary" />
                          <span>{car.transmission || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                          <span className="text-primary">⛽</span>
                          <span className="uppercase">{car.fuel_type || "N/A"}</span>
                          <span>•</span>
                          <span>{car.color || "N/A"}</span>
                          <span>•</span>
                          <span className="text-xs">{car.engine || "N/A"}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-primary/10 pt-3 mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Price</p>
                        <p className="text-2xl font-bold text-primary">
                          KSh {car.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Negotiable • Payment Plans Available</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <Link to={`/car/${car.stock_id || car.id}`} className="block">
                          <Button variant="outline" className="w-full text-xs h-9">
                            View Details
                          </Button>
                        </Link>
                        <a 
                          href={`https://wa.me/254722827458?text=Hi, I'm interested in ${car.year} ${car.make} ${car.model} (Stock ID: ${car.stock_id || car.id})`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button className="w-full gap-1.5 bg-green-600 hover:bg-green-700 text-xs h-9">
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        {/* Contact CTA */}
        <div className="glass-strong rounded-xl p-10 mt-12 border-2 border-primary/30">
          <div className="max-w-2xl mx-auto text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-3">Can't Find What You're Looking For?</h2>
            <p className="text-muted-foreground mb-2 text-lg">
              Contact us and we'll help you source your perfect vehicle
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              ⚠️ <strong>IMPORTANT:</strong> We DO NOT accept online payments. All customers MUST visit our yard physically at <strong>Mpesi Lane 11, Westlands, Nairobi</strong>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp: 0722 827 458
                </Button>
              </a>
              <a href="tel:+254722827458">
                <Button size="lg" variant="outline" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Call: 0722 827 458
                </Button>
              </a>
              <a href="mailto:justicevincentt@gmail.com">
                <Button size="lg" variant="outline" className="gap-2">
                  <Mail className="h-5 w-5" />
                  Email Us
                </Button>
              </a>
            </div>

            <div className="pt-6 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                📍 Mpesi Lane 11, Westlands, Nairobi • 🗺️ <a href="https://maps.app.goo.gl/92DgyWn62UNSR26p8" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View on Map</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Modal */}
      <PaymentMethodsModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />
    </div>
  );
};

export default Catalogue;
