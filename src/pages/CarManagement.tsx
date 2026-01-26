import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Pencil, Trash2, Plus, ArrowLeft, Star, Search, RefreshCw, SortAsc, SortDesc, 
  Calendar, Clock, Eye, MessageSquare, Car, TrendingUp, Download, Filter,
  Flame, Sparkles, Tag, AlertTriangle, CheckCircle, XCircle, FileText
} from "lucide-react";
import { SalesRecordModal } from "@/components/SalesRecordModal";
import { usePagination } from "@/hooks/usePagination";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Car {
  id: string;
  stock_id: string | null;
  make: string;
  model: string;
  year: number;
  price: number;
  purchase_price?: number;
  status: string | null;
  images: any;
  fuel_type: string | null;
  transmission: string | null;
  mileage: string | null;
  color: string | null;
  is_featured: boolean | null;
  is_published?: boolean;
  created_at: string | null;
  listed_at?: string | null;
  promotion_tag?: string | null;
  views_count?: number;
  inquiries_count?: number;
  logbook_status?: string;
  ntsa_status?: string;
  insurance_status?: string;
  inspection_status?: string;
  import_type?: string;
  previous_price?: number;
  vin?: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "reserved", label: "Reserved" },
  { value: "under_repair", label: "Under Repair" },
  { value: "pending_inspection", label: "Pending Inspection" },
  { value: "awaiting_documents", label: "Awaiting Documents" },
];

const PROMOTION_TAGS = [
  { value: "new_arrival", label: "New Arrival", icon: Sparkles, color: "bg-blue-500" },
  { value: "hot_deal", label: "Hot Deal", icon: Flame, color: "bg-orange-500" },
  { value: "price_drop", label: "Price Drop", icon: TrendingUp, color: "bg-green-500" },
  { value: "clearance", label: "Clearance", icon: Tag, color: "bg-red-500" },
  { value: "reserved", label: "Reserved", icon: Clock, color: "bg-purple-500" },
];

const getDaysInStock = (listedAt: string | null, createdAt: string | null): number => {
  const date = listedAt || createdAt;
  if (!date) return 0;
  const listed = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24));
};

const getStockAgingBadge = (days: number) => {
  if (days >= 90) return { label: "90+ days", color: "bg-red-600", severity: "critical" };
  if (days >= 60) return { label: "60+ days", color: "bg-orange-500", severity: "warning" };
  if (days >= 30) return { label: "30+ days", color: "bg-yellow-500", severity: "attention" };
  return null;
};

const getProfitMargin = (sellingPrice: number, purchasePrice?: number): number => {
  if (!purchasePrice || purchasePrice === 0) return 0;
  return Math.round(((sellingPrice - purchasePrice) / purchasePrice) * 100);
};

const CarManagement = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [promotionFilter, setPromotionFilter] = useState<string>("all");
  const [stockAgingFilter, setStockAgingFilter] = useState<string>("all");
  const [importTypeFilter, setImportTypeFilter] = useState<string>("all");
  const [selectedCars, setSelectedCars] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchCars();
    }
  }, [user, role]);

  const fetchCars = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: sortOrder === "asc" });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cars",
        variant: "destructive",
      });
    } else {
      setCars(data || []);
    }
    setLoading(false);
  };

  // Filter and search cars
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (car) =>
          car.make?.toLowerCase().includes(query) ||
          car.model?.toLowerCase().includes(query) ||
          car.stock_id?.toLowerCase().includes(query) ||
          car.transmission?.toLowerCase().includes(query) ||
          car.fuel_type?.toLowerCase().includes(query) ||
          car.color?.toLowerCase().includes(query) ||
          car.year?.toString().includes(query) ||
          car.vin?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((car) => car.status === statusFilter);
    }

    // Apply featured filter
    if (featuredFilter !== "all") {
      const isFeatured = featuredFilter === "featured";
      result = result.filter((car) => car.is_featured === isFeatured);
    }

    // Apply promotion filter
    if (promotionFilter !== "all") {
      result = result.filter((car) => car.promotion_tag === promotionFilter);
    }

    // Apply stock aging filter
    if (stockAgingFilter !== "all") {
      result = result.filter((car) => {
        const days = getDaysInStock(car.listed_at || null, car.created_at);
        if (stockAgingFilter === "30+") return days >= 30;
        if (stockAgingFilter === "60+") return days >= 60;
        if (stockAgingFilter === "90+") return days >= 90;
        if (stockAgingFilter === "fresh") return days < 30;
        return true;
      });
    }

    // Apply import type filter
    if (importTypeFilter !== "all") {
      result = result.filter((car) => car.import_type === importTypeFilter);
    }

    // Apply sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [cars, searchQuery, statusFilter, featuredFilter, promotionFilter, stockAgingFilter, importTypeFilter, sortOrder]);

  // Pagination
  const {
    currentItems: paginatedCars,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination({ items: filteredCars, itemsPerPage: 12 });

  const toggleCarSelection = (carId: string) => {
    const newSelected = new Set(selectedCars);
    if (newSelected.has(carId)) {
      newSelected.delete(carId);
    } else {
      newSelected.add(carId);
    }
    setSelectedCars(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllCars = () => {
    if (selectedCars.size === paginatedCars.length) {
      setSelectedCars(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedCars(new Set(paginatedCars.map((car) => car.id)));
      setShowBulkActions(true);
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedCars.size === 0) return;
    
    const { error } = await supabase
      .from("cars")
      .update({ status: newStatus })
      .in("id", Array.from(selectedCars));

    if (error) {
      toast({ title: "Error", description: "Failed to update cars", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${selectedCars.size} cars updated to ${newStatus}` });
      setSelectedCars(new Set());
      setShowBulkActions(false);
      fetchCars();
    }
  };

  const bulkUpdatePromotion = async (tag: string | null) => {
    if (selectedCars.size === 0) return;
    
    const { error } = await supabase
      .from("cars")
      .update({ promotion_tag: tag })
      .in("id", Array.from(selectedCars));

    if (error) {
      toast({ title: "Error", description: "Failed to update promotions", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Promotion tag updated for ${selectedCars.size} cars` });
      setSelectedCars(new Set());
      setShowBulkActions(false);
      fetchCars();
    }
  };

  const bulkToggleFeatured = async (isFeatured: boolean) => {
    if (selectedCars.size === 0) return;
    
    // When marking as featured, also set promotion_tag to new_arrival and update listed_at
    const updateData: any = { is_featured: isFeatured };
    if (isFeatured) {
      updateData.promotion_tag = 'new_arrival';
      updateData.listed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("cars")
      .update(updateData)
      .in("id", Array.from(selectedCars));

    if (error) {
      toast({ title: "Error", description: "Failed to update featured status", variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `${selectedCars.size} cars ${isFeatured ? 'marked as featured & new arrival' : 'removed from featured'}` 
      });
      setSelectedCars(new Set());
      setShowBulkActions(false);
      fetchCars();
    }
  };

  const bulkDeleteCars = async () => {
    if (selectedCars.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCars.size} cars?`)) return;
    
    const { error } = await supabase
      .from("cars")
      .delete()
      .in("id", Array.from(selectedCars));

    if (error) {
      toast({ title: "Error", description: "Failed to delete cars", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${selectedCars.size} cars deleted` });
      setSelectedCars(new Set());
      setShowBulkActions(false);
      fetchCars();
    }
  };

  const toggleStatus = async (carId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "available" ? "sold" : "available";
    
    if (newStatus === "sold") {
      const car = cars.find(c => c.id === carId);
      if (car) {
        setSelectedCar(car);
        setSalesModalOpen(true);
      }
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("cars")
        .update({ status: newStatus })
        .eq("id", carId);

      if (updateError) throw updateError;

      toast({ title: "Success", description: "Car marked as available" });
      fetchCars();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateCarStatus = async (carId: string, newStatus: string) => {
    const { error } = await supabase
      .from("cars")
      .update({ status: newStatus })
      .eq("id", carId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Car status updated to ${newStatus}` });
      fetchCars();
    }
  };

  const updatePromotionTag = async (carId: string, tag: string | null) => {
    const { error } = await supabase
      .from("cars")
      .update({ promotion_tag: tag })
      .eq("id", carId);

    if (error) {
      toast({ title: "Error", description: "Failed to update promotion", variant: "destructive" });
    } else {
      toast({ title: "Success", description: tag ? `Promotion set to ${tag}` : "Promotion removed" });
      fetchCars();
    }
  };

  const deleteCar = async (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) return;

    const { error } = await supabase.from("cars").delete().eq("id", carId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete car", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Car deleted successfully" });
      fetchCars();
    }
  };

  const toggleFeatured = async (carId: string, currentStatus: boolean | null) => {
    const newFeatured = !currentStatus;
    
    // When marking as featured, also set as new_arrival and reset listed_at
    const updateData: any = { is_featured: newFeatured };
    if (newFeatured) {
      updateData.promotion_tag = 'new_arrival';
      updateData.listed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("cars")
      .update(updateData)
      .eq("id", carId);

    if (error) {
      toast({ title: "Error", description: "Failed to update featured status", variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: newFeatured 
          ? "Car marked as featured & new arrival" 
          : "Car removed from featured"
      });
      fetchCars();
    }
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFeaturedFilter("all");
    setPromotionFilter("all");
    setStockAgingFilter("all");
    setImportTypeFilter("all");
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "available": return "bg-green-600 hover:bg-green-700";
      case "sold": return "bg-red-600 hover:bg-red-700";
      case "reserved": return "bg-purple-600 hover:bg-purple-700";
      case "under_repair": return "bg-yellow-600 hover:bg-yellow-700";
      case "pending_inspection": return "bg-blue-600 hover:bg-blue-700";
      case "awaiting_documents": return "bg-orange-600 hover:bg-orange-700";
      default: return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "available": return "In Stock";
      case "sold": return "Sold Out";
      case "reserved": return "Reserved";
      case "under_repair": return "Under Repair";
      case "pending_inspection": return "Pending Inspection";
      case "awaiting_documents": return "Awaiting Docs";
      default: return status || "Unknown";
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const available = cars.filter(c => c.status === "available").length;
    const sold = cars.filter(c => c.status === "sold").length;
    const reserved = cars.filter(c => c.status === "reserved").length;
    const featured = cars.filter(c => c.is_featured).length;
    const aging30 = cars.filter(c => getDaysInStock(c.listed_at || null, c.created_at) >= 30).length;
    const aging60 = cars.filter(c => getDaysInStock(c.listed_at || null, c.created_at) >= 60).length;
    const aging90 = cars.filter(c => getDaysInStock(c.listed_at || null, c.created_at) >= 90).length;
    return { available, sold, reserved, featured, aging30, aging60, aging90 };
  }, [cars]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <>
      {selectedCar && (
        <SalesRecordModal
          isOpen={salesModalOpen}
          onClose={() => {
            setSalesModalOpen(false);
            setSelectedCar(null);
          }}
          carId={selectedCar.id}
          carInfo={{
            make: selectedCar.make,
            model: selectedCar.model,
            year: selectedCar.year,
            price: selectedCar.price,
          }}
          onSuccess={fetchCars}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <h1 className="text-3xl font-bold">Car Management</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchCars}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => navigate("/admin/cars/add")} className="gap-2">
                <Plus className="h-5 w-5" />
                Add New Car
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("all")}>
              <div className="text-2xl font-bold">{cars.length}</div>
              <div className="text-xs text-muted-foreground">Total Cars</div>
            </Card>
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("available")}>
              <div className="text-2xl font-bold text-green-500">{stats.available}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </Card>
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("sold")}>
              <div className="text-2xl font-bold text-red-500">{stats.sold}</div>
              <div className="text-xs text-muted-foreground">Sold</div>
            </Card>
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("reserved")}>
              <div className="text-2xl font-bold text-purple-500">{stats.reserved}</div>
              <div className="text-xs text-muted-foreground">Reserved</div>
            </Card>
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setFeaturedFilter("featured")}>
              <div className="text-2xl font-bold text-amber-500">{stats.featured}</div>
              <div className="text-xs text-muted-foreground">Featured</div>
            </Card>
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setStockAgingFilter("60+")}>
              <div className="text-2xl font-bold text-orange-500">{stats.aging60}</div>
              <div className="text-xs text-muted-foreground">60+ Days</div>
            </Card>
            <Card className="p-3 cursor-pointer hover:bg-secondary/50" onClick={() => setStockAgingFilter("90+")}>
              <div className="text-2xl font-bold text-red-500">{stats.aging90}</div>
              <div className="text-xs text-muted-foreground">90+ Days</div>
            </Card>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-3 p-4 bg-secondary/30 rounded-lg">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, stock ID, VIN, transmission, color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cars</SelectItem>
                  <SelectItem value="featured">Featured Only</SelectItem>
                  <SelectItem value="not-featured">Not Featured</SelectItem>
                </SelectContent>
              </Select>

              <Select value={promotionFilter} onValueChange={setPromotionFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Promotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Promotions</SelectItem>
                  {PROMOTION_TAGS.map(tag => (
                    <SelectItem key={tag.value} value={tag.value}>{tag.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Select value={stockAgingFilter} onValueChange={setStockAgingFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Stock Age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="fresh">Fresh (&lt;30 days)</SelectItem>
                  <SelectItem value="30+">30+ Days</SelectItem>
                  <SelectItem value="60+">60+ Days</SelectItem>
                  <SelectItem value="90+">90+ Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={importTypeFilter} onValueChange={setImportTypeFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Import Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={toggleSortOrder} className="gap-2">
                <Calendar className="h-4 w-4" />
                {sortOrder === "desc" ? (
                  <>
                    <SortDesc className="h-4 w-4" />
                    Newest First
                  </>
                ) : (
                  <>
                    <SortAsc className="h-4 w-4" />
                    Oldest First
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Results Summary & Bulk Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedCars.size === paginatedCars.length && paginatedCars.length > 0}
                onCheckedChange={selectAllCars}
              />
              <p className="text-sm text-muted-foreground">
                Showing {paginatedCars.length} of {filteredCars.length} cars
                {searchQuery && ` matching "${searchQuery}"`}
                {selectedCars.size > 0 && ` • ${selectedCars.size} selected`}
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {showBulkActions && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {STATUS_OPTIONS.filter(s => s.value !== "all").map(opt => (
                        <DropdownMenuItem key={opt.value} onClick={() => bulkUpdateStatus(opt.value)}>
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Promotion
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => bulkUpdatePromotion(null)}>
                        Remove Promotion
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {PROMOTION_TAGS.map(tag => (
                        <DropdownMenuItem key={tag.value} onClick={() => bulkUpdatePromotion(tag.value)}>
                          {tag.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Star className="h-4 w-4" />
                        Bulk Featured
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => bulkToggleFeatured(true)}>
                        <Star className="h-4 w-4 mr-2 fill-amber-500 text-amber-500" />
                        Mark as Featured & New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => bulkToggleFeatured(false)}>
                        <Star className="h-4 w-4 mr-2" />
                        Remove Featured
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="destructive" size="sm" onClick={bulkDeleteCars}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete ({selectedCars.size})
                  </Button>
                </>
              )}

              <Button variant="outline" size="sm" onClick={() => navigate("/admin/rentals")}>
                Manage Rentals
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/trade-ins")}>
                Manage Trade-Ins
              </Button>
            </div>
          </div>
        </div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <TooltipProvider>
            {paginatedCars.map((car) => {
              const daysInStock = getDaysInStock(car.listed_at || null, car.created_at);
              const agingBadge = getStockAgingBadge(daysInStock);
              const profitMargin = getProfitMargin(car.price, car.purchase_price);
              const promotionTag = PROMOTION_TAGS.find(t => t.value === car.promotion_tag);

              return (
                <Card key={car.id} className={`glass-strong overflow-hidden transition-all ${selectedCars.has(car.id) ? 'ring-2 ring-primary' : ''}`}>
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                    {getImageUrl(car.images) && (
                      <img
                        src={getImageUrl(car.images)}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedCars.has(car.id)}
                        onCheckedChange={() => toggleCarSelection(car.id)}
                        className="bg-background/80"
                      />
                    </div>

                    {/* Status badge */}
                    <Badge className={`absolute top-2 right-2 ${getStatusColor(car.status)}`}>
                      {getStatusLabel(car.status)}
                    </Badge>

                    {/* Featured badge */}
                    {car.is_featured && (
                      <Badge className="absolute top-10 right-2 bg-amber-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}

                    {/* Promotion tag */}
                    {promotionTag && (
                      <Badge className={`absolute bottom-2 left-2 ${promotionTag.color}`}>
                        <promotionTag.icon className="h-3 w-3 mr-1" />
                        {promotionTag.label}
                      </Badge>
                    )}

                    {/* Stock aging indicator */}
                    {agingBadge && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={`absolute bottom-2 right-2 ${agingBadge.color}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {agingBadge.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This car has been in stock for {daysInStock} days</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Price drop indicator */}
                    {car.previous_price && car.previous_price > car.price && (
                      <Badge className="absolute top-10 left-2 bg-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Price Drop
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">{car.make} {car.model}</span>
                      {profitMargin > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              +{profitMargin}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Profit Margin</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Stock ID: {car.stock_id || "N/A"}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-1.5 mb-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year:</span>
                        <span className="font-medium">{car.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">KSh {car.price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mileage:</span>
                        <span className="font-medium">{car.mileage || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days in Stock:</span>
                        <span className="font-medium">{daysInStock}</span>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-2 mb-3 text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {car.views_count || 0}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Views</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {car.inquiries_count || 0}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Inquiries</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {STATUS_OPTIONS.filter(s => s.value !== "all").map(opt => (
                              <DropdownMenuItem 
                                key={opt.value} 
                                onClick={() => updateCarStatus(car.id, opt.value)}
                              >
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Tag className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => updatePromotionTag(car.id, null)}>
                              Remove Tag
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {PROMOTION_TAGS.map(tag => (
                              <DropdownMenuItem 
                                key={tag.value} 
                                onClick={() => updatePromotionTag(car.id, tag.value)}
                              >
                                <tag.icon className="h-4 w-4 mr-2" />
                                {tag.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          size="sm"
                          variant={car.is_featured ? "default" : "outline"}
                          onClick={() => toggleFeatured(car.id, car.is_featured)}
                          title="Toggle Featured"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/admin/cars/edit/${car.id}`)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCar(car.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TooltipProvider>
        </div>
        
        {filteredCars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No cars found matching your search criteria.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={prevPage} className="cursor-pointer" />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => goToPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext onClick={nextPage} className="cursor-pointer" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
};

export default CarManagement;
