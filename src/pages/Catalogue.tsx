import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Phone, Mail, MessageCircle } from "lucide-react";

const Catalogue = () => {
  // Sample data - in a real app this would come from a database
  const cars = [
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
          <Button size="lg" className="bg-pink-600 hover:bg-pink-700">+ Add Car</Button>
          <Button size="lg" className="bg-green-600 hover:bg-green-700">View Rentals</Button>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Trade-In Your Car</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by name or brand..." className="pl-10" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="glass-strong rounded-2xl overflow-hidden hover:scale-105 transition-transform">
            {/* Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
              <div className="absolute top-4 left-4 flex gap-2">
                {car.featured && <Badge className="bg-yellow-600">Featured</Badge>}
                {car.onSale && <Badge className="bg-green-600">On Sale</Badge>}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold">{car.name}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-medium">{car.rating}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {car.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-3xl font-bold text-primary mb-4">{car.price}</div>

              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-6">
                <div>{car.year}</div>
                <div>{car.fuel}</div>
                <div>{car.transmission}</div>
                <div>{car.mileage}</div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button size="sm" variant="outline" className="gap-1">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>

              <Button className="w-full">Quick View →</Button>
            </div>
          </div>
        ))}
      </div>

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
