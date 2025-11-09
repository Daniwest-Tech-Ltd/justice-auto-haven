import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Phone, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

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
  images: any;
  stock_id: string | null;
  is_featured: boolean | null;
}

const Catalogue = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [searchQuery, cars]);

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
    if (!searchQuery.trim()) {
      setFilteredCars(cars);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = cars.filter(
      (car) =>
        car.make.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.year.toString().includes(query) ||
        car.fuel_type?.toLowerCase().includes(query) ||
        car.transmission?.toLowerCase().includes(query)
    );

    setFilteredCars(filtered);
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Remove sample data array
  const sampleCars = [
    {
      id: 1,
      name: "Lexus LX600 Ultra",
      rating: 4.9,
      category: "SUV",
      tags: ["Luxury", "Japanese", "Ultra"],
      price: "KSh 12,500,000",
      year: 2024,
      fuel: "Petrol",
      transmission: "10-Speed Automatic",
      mileage: "8,000 km",
      featured: true,
      onSale: true,
    },
    {
      id: 2,
      name: "Mercedes-Benz GLS",
      rating: 5.0,
      category: "SUV",
      tags: ["Luxury", "Mercedes", "Performance"],
      price: "KSh 22,000,000",
      year: 2024,
      fuel: "Petrol",
      transmission: "9G-Tronic AMG",
      mileage: "5,000 km",
      featured: true,
      onSale: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="glass-strong rounded-3xl p-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-accent bg-clip-text text-transparent">CATALOGUE</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          🚗 Discover our premium collection of vehicles from luxury cars to commercial vehicles, all available for rent or purchase.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name, brand, year..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="sedan">Sedan</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Sort: Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cars Grid */}
      {filteredCars.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <h3 className="text-2xl font-bold mb-4">No cars found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? `No results for "${searchQuery}". Try searching for different keywords.` : "No cars available at the moment."}
          </p>
          {searchQuery && (
            <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <Link
              key={car.id}
              to={`/car/${car.stock_id || car.id}`}
              className="glass-strong rounded-2xl overflow-hidden hover:scale-105 transition-transform block"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                {getImageUrl(car.images) ? (
                  <img
                    src={getImageUrl(car.images)}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">{car.make.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  {car.is_featured && <Badge className="bg-yellow-600">Featured</Badge>}
                  {car.status === "available" ? (
                    <Badge className="bg-green-600">In Stock</Badge>
                  ) : (
                    <Badge className="bg-red-600">Sold Out</Badge>
                  )}
                </div>
                {/* Brand Logo Placeholder */}
                <div className="absolute bottom-4 right-4 bg-background/90 rounded-full p-2">
                  <span className="text-xs font-bold">{car.make}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold">
                    {car.make} {car.model}
                  </h3>
                  <span className="text-sm text-muted-foreground">{car.year}</span>
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  Stock ID: {car.stock_id || "N/A"}
                </div>

                <div className="text-3xl font-bold text-primary mb-4">
                  KSh {car.price.toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-6">
                  <div>{car.fuel_type || "N/A"}</div>
                  <div>{car.transmission || "N/A"}</div>
                  <div className="col-span-2">{car.mileage || "N/A"} km</div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button size="sm" variant="outline" className="gap-1" onClick={(e) => e.stopPropagation()}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={(e) => e.stopPropagation()}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={(e) => e.stopPropagation()}>
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>

                <Button className="w-full">Quick View →</Button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
        <Button variant="outline" disabled>Prev</Button>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
          <Button
            key={page}
            variant={page === 1 ? "default" : "outline"}
            className={page === 1 ? "bg-yellow-600 hover:bg-yellow-700" : ""}
          >
            {page}
          </Button>
        ))}
        <Button variant="outline">Next</Button>
      </div>

      {/* CTA */}
      <div className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
        <p className="text-muted-foreground mb-6">
          Contact our team for custom vehicle sourcing, special requests, or to discuss your specific automotive needs.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">Contact Us</Button>
          <Button size="lg" variant="outline">Our Services</Button>
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
