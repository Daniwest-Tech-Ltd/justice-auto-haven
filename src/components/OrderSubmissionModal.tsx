import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface OrderSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

export const OrderSubmissionModal = ({ open, onOpenChange, car }: OrderSubmissionModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    contact_method: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("whitelist_orders").insert([
        {
          car_id: car.id,
          car_make: car.make,
          car_model: car.model,
          car_year: car.year,
          car_price: car.price,
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          contact_method: formData.contact_method,
          status: "pending",
        },
      ]);

      if (error) throw error;

      // Send notification to admin
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .in("user_id", 
          await supabase.from("user_roles")
            .select("user_id")
            .eq("role", "admin")
            .then(res => res.data?.map(r => r.user_id) || [])
        );

      if (adminProfiles && adminProfiles.length > 0) {
        await supabase.from("notifications").insert(
          adminProfiles.map(profile => ({
            user_id: profile.user_id,
            type: "order",
            title: "New VIP Order",
            message: `${formData.full_name} placed an order for ${car.make} ${car.model}`,
            metadata: { car_id: car.id, order_type: "whitelist" },
          }))
        );
      }

      setShowSuccess(true);
      setFormData({ full_name: "", phone: "", email: "", contact_method: "" });
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

  const handleClose = () => {
    setShowSuccess(false);
    onOpenChange(false);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">✅ Order Submitted Successfully!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              We have reviewed your order and we will get in touch with you as soon as possible.
            </p>
            <div className="bg-accent/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">For more information, contact us:</p>
              <p className="text-sm">📞 Phone: 0722827458</p>
              <p className="text-sm">📧 Email: justicevincentt@gmail.com</p>
              <p className="text-sm text-muted-foreground">Response within 24 hours ⏳</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place VIP Order</DialogTitle>
          <DialogDescription>
            {car.make} {car.model} ({car.year}) - KSH {car.price.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (WhatsApp) *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="0722827458"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_method">How can we reach you? *</Label>
            <Select
              value={formData.contact_method}
              onValueChange={(value) => setFormData({ ...formData, contact_method: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred contact method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                <SelectItem value="call">📞 Phone Call</SelectItem>
                <SelectItem value="sms">✉️ SMS</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
