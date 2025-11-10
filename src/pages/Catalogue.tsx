import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Phone, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { usePagination } from "@/hooks/usePagination";
import { useAuth } from "@/hooks/useAuth";

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
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filters, setFilters] = useState({
    brand: "all",
    year: "all",
    availability: "all",
    fuelType: "all",
  });
  const { user } = useAuth();

  const { currentItems, currentPage, totalPages, goToPage, nextPage, prevPage, resetPagination } = usePagination({
    items: filteredCars,
    itemsPerPage: 20,
  });

  useEffect(() => {
    fetchCars();
    fetchBrands();
  }, []);

  useEffect(() => {
    filterCars();
  }, [searchQuery, cars, filters]);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");
    if (!error && data) {
      setBrands(data);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCars(data);
      setFilteredCars(data);
    }
    setLoading(false);
  };

  const filterCars = () => {
    let filtered = [...cars];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (car) =>
          car.make.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.year.toString().includes(query) ||
          car.fuel_type?.toLowerCase().includes(query) ||
          car.transmission?.toLowerCase().includes(query)
      );
    }

    if (filters.brand && filters.brand !== "all") {
      filtered = filtered.filter((car) => car.make.toLowerCase() === filters.brand.toLowerCase());
    }

    if (filters.year && filters.year !== "all") {
      filtered = filtered.filter((car) => car.year.toString() === filters.year);
    }

    if (filters.availability && filters.availability !== "all") {
      filtered = filtered.filter((car) => car.status === filters.availability);
    }

    if (filters.fuelType && filters.fuelType !== "all") {
      filtered = filtered.filter((car) => car.fuel_type?.toLowerCase() === filters.fuelType.toLowerCase());
    }

    setFilteredCars(filtered);
    resetPagination();
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  const getBrandLogo = (make: string) => {
    const brand = brands.find(b => b.name.toLowerCase() === make.toLowerCase());
    return brand?.logo_url;
  };

  const trackView = async (carId: string) => {
    await supabase.from("view_tracking").insert({
      user_id: user?.id || null,
      car_id: carId,
    });

    const { data: adminData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (adminData) {
      await supabase.from("notifications").insert({
        user_id: adminData.user_id,
        title: "Car View",
        message: `Someone viewed a car listing`,
        type: "view",
        metadata: { car_id: carId },
      });
    }
  };

  const handleContactClick = (e: React.MouseEvent, type: string, car: Car) => {
    e.preventDefault();
    e.stopPropagation();
    
    const phone = "+254722827458";
    const email = "justicevincentt@gmail.com";
    const message = `Hi, I'm interested in the ${car.year} ${car.make} ${car.model} (Stock ID: ${car.stock_id})`;

    switch (type) {
      case "whatsapp":
        window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
        break;
      case "call":
        window.location.href = `tel:${phone}`;
        break;
      case "email":
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Inquiry about ${car.make} ${car.model}`)}&body=${encodeURIComponent(message)}`;
        break;
      case "sms":
        window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
        break;
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilters({
      brand: "all",
      year: "all",
      availability: "all",
      fuelType: "all",
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-accent bg-clip-text text-transparent">CATALOGUE</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          🚗 Discover our premium collection of vehicles from luxury cars to commercial vehicles.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/rental-booking">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">View Rentals</Button>
          </Link>
          <Link to="/trade-in">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Trade-In Your Car</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filters.brand} onValueChange={(value) => setFilters({ ...filters, brand: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.name || `brand-${brand.id}`}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.year} onValueChange={(value) => setFilters({ ...filters, year: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.availability} onValueChange={(value) => setFilters({ ...filters, availability: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.fuelType} onValueChange={(value) => setFilters({ ...filters, fuelType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Fuel Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fuel Types</SelectItem>
              <SelectItem value="petrol">Petrol</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={resetFilters} variant="outline">Reset</Button>
        </div>
      </div>

      {/* Cars Grid - 5 per row */}
      {filteredCars.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <h3 className="text-2xl font-bold mb-4">No cars found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || Object.values(filters).some(v => v) ? "Try adjusting your filters." : "No cars available at the moment."}
          </p>
          {(searchQuery || Object.values(filters).some(v => v)) && (
            <Button onClick={resetFilters}>Clear Filters</Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {currentItems.map((car) => (
              <Link
                key={car.id}
                to={`/car/${car.stock_id || car.id}`}
                onClick={() => trackView(car.id)}
                className="glass-strong rounded-xl overflow-hidden hover:scale-105 transition-transform block"
              >
                <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                  {getImageUrl(car.images) ? (
                    <img
                      src={getImageUrl(car.images)}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">{car.make.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {car.is_featured && <Badge className="bg-yellow-600 text-xs">Featured</Badge>}
                    {car.status === "available" ? (
                      <Badge className="bg-green-600 text-xs">In Stock</Badge>
                    ) : (
                      <Badge className="bg-red-600 text-xs">Sold</Badge>
                    )}
                  </div>
                  {getBrandLogo(car.make) ? (
                    <div className="absolute bottom-2 right-2 bg-background/90 rounded-full p-1">
                      <img src={getBrandLogo(car.make)!} alt={car.make} className="h-6 w-6 object-contain" />
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 bg-background/90 rounded-full px-2 py-1">
                      <span className="text-xs font-bold">{car.make}</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1">
                    {car.make} {car.model}
                  </h3>
                  <span className="text-xs text-muted-foreground">{car.year}</span>

                  <div className="text-lg font-bold text-primary my-2">
                    KSh {car.price.toLocaleString()}
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
                    <div>{car.fuel_type || "N/A"}</div>
                    <div>{car.transmission || "N/A"}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 p-0"
                      onClick={(e) => handleContactClick(e, "whatsapp", car)}
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 p-0"
                      onClick={(e) => handleContactClick(e, "call", car)}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 p-0"
                      onClick={(e) => handleContactClick(e, "email", car)}
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={prevPage}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => goToPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={nextPage}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* CTA */}
      <div className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
        <p className="text-muted-foreground mb-6">
          Contact our team for custom vehicle sourcing, special requests, or to discuss your specific automotive needs.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/contact">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">Contact Us</Button>
          </Link>
          <Link to="/services">
            <Button size="lg" variant="outline">Our Services</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
