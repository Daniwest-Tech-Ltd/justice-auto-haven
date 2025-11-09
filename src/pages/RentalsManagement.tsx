import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

interface Rental {
  id: string;
  car_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  profiles: {
    full_name: string;
    email: string;
  };
  cars: {
    make: string;
    model: string;
  };
}

const RentalsManagement = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const { data: rentalsData, error: rentalsError } = await supabase
        .from("rentals")
        .select("*")
        .order("created_at", { ascending: false });

      if (rentalsError) throw rentalsError;

      // Fetch related data
      const rentalsWithDetails = await Promise.all(
        (rentalsData || []).map(async (rental) => {
          const [profileResult, carResult] = await Promise.all([
            supabase.from("profiles").select("full_name, email").eq("user_id", rental.user_id).single(),
            supabase.from("cars").select("make, model").eq("id", rental.car_id).single()
          ]);

          return {
            ...rental,
            profiles: profileResult.data || { full_name: "", email: "" },
            cars: carResult.data || { make: "", model: "" }
          };
        })
      );

      setRentals(rentalsWithDetails);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("rentals")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rental status updated",
      });
      fetchRentals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/cars")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Car Management
      </Button>

      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Rental Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentals.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rental.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{rental.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {rental.cars?.make} {rental.cars?.model}
                    </TableCell>
                    <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(rental.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>KSh {rental.total_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rental.status === "confirmed"
                            ? "default"
                            : rental.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {rental.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {rental.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(rental.id, "confirmed")}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(rental.id, "cancelled")}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalsManagement;