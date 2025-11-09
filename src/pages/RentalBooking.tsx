import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";

const RentalBooking = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    car_id: "",
    start_date: "",
    end_date: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to book a rental",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Calculate total price (example: 5000 per day)
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = days * 5000;

      const { error } = await supabase
        .from("rentals")
        .insert([{
          user_id: session.user.id,
          car_id: formData.car_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_price: totalPrice,
          status: "pending",
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your rental request has been submitted. We'll contact you shortly!",
      });

      navigate("/customer-dashboard");
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

  return (
    <div className="container mx-auto px-4 py-12">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="glass-strong max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Book a Rental
            </span>
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Fill out the form below to request a vehicle rental
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="car_id">Car Stock ID</Label>
              <Input
                id="car_id"
                value={formData.car_id}
                onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
                placeholder="Enter car stock ID from catalogue"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_date"
                    type="date"
                    className="pl-10"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end_date"
                    type="date"
                    className="pl-10"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Rental rate is KSh 5,000 per day. You'll receive a confirmation
                email with the exact quote and payment details.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Rental Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalBooking;
