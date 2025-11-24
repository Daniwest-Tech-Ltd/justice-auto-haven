import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const TradeInSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    car_make: "",
    car_model: "",
    car_year: "",
    car_mileage: "",
    car_condition: "good",
    description: "",
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
          description: "Please sign in to submit a trade-in request",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("trade_ins")
        .insert([{
          user_id: session.user.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          car_make: formData.car_make,
          car_model: formData.car_model,
          car_year: parseInt(formData.car_year),
          car_mileage: formData.car_mileage,
          car_condition: formData.car_condition,
          description: formData.description,
          status: "pending",
        }]);

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke("send-notifications", {
        body: {
          type: "trade_in",
          to: formData.email,
          data: {
            customerName: formData.name,
            carMake: formData.car_make,
            carModel: formData.car_model,
            carYear: formData.car_year,
            carMileage: formData.car_mileage,
            carCondition: formData.car_condition,
          },
        },
      });

      toast({
        title: "Success",
        description: "Your trade-in request has been submitted. We'll evaluate it and get back to you!",
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
      <div className="flex justify-between items-center mb-6 gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/catalogue")}
            className="font-semibold"
          >
            CATALOGUE
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/rental-catalogue")}
            className="font-semibold"
          >
            RENT
          </Button>
        </div>
      </div>

      <Card className="glass-strong max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Car Trade-In Kenya | Swap Your Car Easily
            </span>
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Get free car valuation in Nairobi - Best trade-in deals in Kenya
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="car_make">Make *</Label>
                <Input
                  id="car_make"
                  value={formData.car_make}
                  onChange={(e) => setFormData({ ...formData, car_make: e.target.value })}
                  placeholder="e.g., Toyota"
                  required
                />
              </div>

              <div>
                <Label htmlFor="car_model">Model *</Label>
                <Input
                  id="car_model"
                  value={formData.car_model}
                  onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
                  placeholder="e.g., Land Cruiser"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="car_year">Year *</Label>
                <Input
                  id="car_year"
                  type="number"
                  value={formData.car_year}
                  onChange={(e) => setFormData({ ...formData, car_year: e.target.value })}
                  placeholder="e.g., 2020"
                  required
                />
              </div>

              <div>
                <Label htmlFor="car_mileage">Mileage (km) *</Label>
                <Input
                  id="car_mileage"
                  value={formData.car_mileage}
                  onChange={(e) => setFormData({ ...formData, car_mileage: e.target.value })}
                  placeholder="e.g., 50,000"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="car_condition">Condition *</Label>
              <Select
                value={formData.car_condition}
                onValueChange={(value) => setFormData({ ...formData, car_condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Additional Details</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Any additional information about your vehicle..."
                rows={4}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Next Steps:</strong> Our team will review your submission and contact you
                within 24-48 hours with a valuation offer.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Trade-In Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeInSubmission;