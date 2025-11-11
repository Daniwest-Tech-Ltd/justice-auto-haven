import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

interface SalesRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  carId: string;
  carInfo: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
  onSuccess: () => void;
}

export const SalesRecordModal = ({ isOpen, onClose, carId, carInfo, onSuccess }: SalesRecordModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    salePrice: carInfo.price.toString(),
    paymentType: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update car status
      const { error: updateError } = await supabase
        .from("cars")
        .update({ status: "sold" })
        .eq("id", carId);

      if (updateError) throw updateError;

      // Create sales record
      const { error: salesError } = await supabase
        .from("sales")
        .insert({
          car_id: carId,
          sale_price: parseFloat(formData.salePrice),
          sale_date: new Date().toISOString().split('T')[0],
          payment_type: formData.paymentType,
          notes: `Customer: ${formData.customerName}\nPhone: ${formData.customerPhone}\nEmail: ${formData.customerEmail}\n\nNotes: ${formData.notes}`,
        });

      if (salesError) throw salesError;

      // Send notification to admin
      const { data: adminData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (adminData) {
        await supabase.from("notifications").insert({
          user_id: adminData.user_id,
          title: "Car Sold",
          message: `${carInfo.make} ${carInfo.model} ${carInfo.year} has been sold for KSh ${parseFloat(formData.salePrice).toLocaleString()}`,
          type: "sale",
          metadata: { 
            car_id: carId, 
            sale_price: parseFloat(formData.salePrice),
            customer_name: formData.customerName 
          },
        });
      }

      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });

      onSuccess();
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Record Sale
          </DialogTitle>
          <DialogDescription>
            Recording sale for {carInfo.make} {carInfo.model} {carInfo.year}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salePrice">Sale Price (KSh)</Label>
            <Input
              id="salePrice"
              type="number"
              required
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card Payment</SelectItem>
                <SelectItem value="financing">Financing</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Customer Phone</Label>
            <Input
              id="customerPhone"
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information about the sale..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};