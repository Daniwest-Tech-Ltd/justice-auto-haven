import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Phone, Mail, MessageCircle, Car, Gauge, Settings as SettingsIcon, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { usePagination } from "@/hooks/usePagination";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    brand: searchParams.get("brand") || "all",
    year: "all",
    availability: "all",
    fuelType: "all",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage, resetPagination } = usePagination({
    items: filteredCars,
    itemsPerPage: 12,
  });

  useEffect(() => {
    fetchCars();
    fetchBrands();
    fetchWishlist();
  }, []);

  useEffect(() => {
    filterCars();
  }, [cars, searchQuery, filters]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    const { data } = await supabase.from("brands").select("*").order("name");
    if (data) setBrands(data);
  };

  const fetchWishlist = async () => {
    if (user) {
      const { data } = await supabase
        .from("wishlist")
        .select("car_id")
        .eq("user_id", user.id);
      
      setWishlist(data?.map(w => w.car_id) || []);
    } else {
      const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlist(local);
    }
  };

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
        toast({ title: "Removed from wishlist" });
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
        toast({ title: "Added to wishlist" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filterCars = () => {
    let filtered = [...cars];

    if (searchQuery) {
      filtered = filtered.filter(
        (car) =>
          car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
          car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          car.year.toString().includes(searchQuery)
      );
    }

    if (filters.brand !== "all") {
      filtered = filtered.filter((car) => car.make === filters.brand);
    }

    if (filters.year !== "all") {
      filtered = filtered.filter((car) => car.year.toString() === filters.year);
    }

    if (filters.availability !== "all") {
      filtered = filtered.filter((car) => car.status === filters.availability);
    }

    if (filters.fuelType !== "all") {
      filtered = filtered.filter((car) => car.fuel_type === filters.fuelType);
    }

    setFilteredCars(filtered);
    resetPagination();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      brand: "all",
      year: "all",
      availability: "all",
      fuelType: "all",
    });
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      try {
        return JSON.parse(images);
      } catch {
        return [images];
      }
    }
    return [];
  };

  const getBrandLogo = (make: string) => {
    const brand = brands.find(b => b.name.toLowerCase() === make.toLowerCase());
    return brand?.logo_url;
  };

  const uniqueYears = Array.from(new Set(cars.map((car) => car.year)))
    .sort((a, b) => b - a);

  const uniqueMakes = Array.from(new Set(cars.map((car) => car.make).filter(make => make && make.trim() !== ''))).sort();

  const uniqueFuelTypes = Array.from(new Set(cars.map((car) => car.fuel_type).filter(type => type && type.trim() !== ''))).sort();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center bg-gradient-accent bg-clip-text text-transparent">
          Vehicle Catalogue
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Browse our collection of premium vehicles
        </p>

        {/* Search and Filters */}
        <div className="glass-strong rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          </div>

          {(searchQuery || filters.brand !== "all" || filters.year !== "all" || filters.fuelType !== "all") && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCars.length} of {cars.length} vehicles
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Cars Grid */}
        {filteredCars.length === 0 ? (
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
              {currentItems.map((car) => {
                const images = getImages(car.images);
                const brandLogo = getBrandLogo(car.make);
                
                return (
                  <Link
                    key={car.id}
                    to={`/car/${car.stock_id || car.id}`}
                    className="glass-strong rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={images[0] || "/placeholder.svg"}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Badge className="absolute top-2 left-2 bg-primary">
                        {car.year}
                      </Badge>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={(e) => toggleWishlist(e, car.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            wishlist.includes(car.id) ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                      </Button>
                      {brandLogo && (
                        <div className="absolute bottom-2 left-2 bg-white/90 rounded p-1">
                          <img src={brandLogo} alt={car.make} className="h-6 w-auto object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">
                        {car.make} {car.model}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          {car.mileage || "N/A"}
                        </span>
                        <span>•</span>
                        <span className="uppercase">{car.fuel_type || "N/A"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <SettingsIcon className="h-4 w-4" />
                          {car.transmission || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-primary">
                          KSH {car.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="border-t border-white/10 mt-4 pt-3">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                          <Car className="h-4 w-4 text-primary" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => prevPage()} 
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => goToPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => nextPage()} 
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* Contact CTA */}
        <div className="glass-strong rounded-lg p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us and we'll help you find your perfect vehicle
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+254722827458">
              <Button className="gap-2">
                <Phone className="h-4 w-4" />
                Call Us
              </Button>
            </a>
            <a href="mailto:justicevincentt@gmail.com">
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email Us
              </Button>
            </a>
            <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
