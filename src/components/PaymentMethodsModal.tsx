import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Phone, Mail, MapPin, Shield, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentMethodsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentMethodsModal = ({ open, onOpenChange }: PaymentMethodsModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappMessage = `*Lipa Mdogo Mdogo Inquiry*%0A%0AName: ${formData.name}%0APhone: ${formData.phone}%0AEmail: ${formData.email}%0AMessage: ${formData.message}`;
    window.open(`https://wa.me/254722827458?text=${whatsappMessage}`, '_blank');
    toast.success("Redirecting to WhatsApp...");
    setFormData({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            💰 Lipa Mdogo Mdogo & Payment Methods
          </DialogTitle>
        </DialogHeader>

        {/* Critical Warning Section */}
        <div className="glass-strong border-2 border-red-500/50 rounded-lg p-6 mb-6 animate-pulse">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-500 mb-2">⚠️ IMPORTANT SECURITY NOTICE</h3>
              <p className="text-base font-semibold mb-2">
                DO NOT PAY ANYTHING ONLINE OR THROUGH THIS WEBSITE!
              </p>
              <p className="text-sm text-muted-foreground">
                All payments must be made IN PERSON at our yard after physical vehicle inspection. 
                We do not accept online payments. Anyone asking for online payment is a SCAMMER.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Lipa Mdogo Mdogo */}
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Lipa Mdogo Mdogo Plan
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Own your dream car with flexible payment options tailored to your budget.
              </p>

              <div className="space-y-4">
                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-primary">Requirements:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <span>Valid National ID or Passport</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <span>3 months payslips (Employed) OR Business registration & proof of income</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <span>Deposit amount (Varies by vehicle)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <span>KRA PIN certificate</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-primary">Process:</h4>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>Visit our yard and select your car</li>
                    <li>Submit required documents</li>
                    <li>Application review (24-48 hours)</li>
                    <li>Approval & payment plan setup</li>
                    <li>Pay deposit at our yard</li>
                    <li>Drive away your car</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Apply for Lipa Mdogo Mdogo</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Vehicle Interest & Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="glass-input"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                  <Phone className="mr-2 h-4 w-4" />
                  Send Inquiry via WhatsApp
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Payment Methods */}
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Banknote className="h-6 w-6 text-primary" />
                Accepted Payment Methods
              </h3>
              <p className="text-sm text-red-500 font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                All payments MUST be made at our yard only!
              </p>

              <div className="space-y-4">
                {/* Mobile Money */}
                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Mobile Money
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-green-600 font-bold text-lg">M-PESA</div>
                      <p className="text-xs text-muted-foreground">Safaricom</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-red-600 font-bold text-lg">Airtel Money</div>
                      <p className="text-xs text-muted-foreground">Airtel</p>
                    </div>
                  </div>
                </div>

                {/* Credit/Debit Cards */}
                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Credit & Debit Cards
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-blue-600 font-bold text-lg">VISA</div>
                      <p className="text-xs text-muted-foreground">All Banks</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-orange-600 font-bold text-lg">Mastercard</div>
                      <p className="text-xs text-muted-foreground">All Banks</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-blue-500 font-bold text-sm">American Express</div>
                      <p className="text-xs text-muted-foreground">AMEX</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-blue-700 font-bold text-sm">Visa Debit</div>
                      <p className="text-xs text-muted-foreground">Kenya Banks</p>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    Bank Transfer
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>• Direct bank deposit</p>
                    <p>• RTGS/EFT transfers</p>
                    <p>• All major Kenyan banks accepted</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Bank details provided after physical yard visit
                    </p>
                  </div>
                </div>

                {/* Cash */}
                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    Cash Payment
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>• Cash accepted at our yard</p>
                    <p>• Receipt issued immediately</p>
                    <p>• Secure payment environment</p>
                  </div>
                </div>

                {/* International Cards */}
                <div className="glass-strong rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-sm">International Payment Cards</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded p-2 text-center text-xs font-semibold">
                      PayPal (at yard)
                    </div>
                    <div className="bg-background/50 rounded p-2 text-center text-xs font-semibold">
                      International Visa
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Our Yard */}
            <div className="glass-strong border-2 border-primary/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-primary">Visit Our Yard</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Justice Ultimate Automobiles</p>
                    <p className="text-sm text-muted-foreground">Mpesi Lane 11, Westlands, Nairobi</p>
                    <a 
                      href="https://maps.app.goo.gl/92DgyWn62UNSR26p8" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <a href="tel:0722827458" className="text-sm hover:text-primary">0722 827 458</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <a href="mailto:support@justiceultimateautomobiles.com" className="text-sm hover:text-primary">
                    support@justiceultimateautomobiles.com
                  </a>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-primary/20">
                <Button 
                  onClick={() => window.open('https://wa.me/254722827458?text=I%20want%20to%20visit%20your%20yard', '_blank')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  WhatsApp: 0722 827 458
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Warning */}
        <div className="glass-strong border border-red-500/30 rounded-lg p-4 mt-4">
          <p className="text-center text-sm font-semibold text-red-500">
            🔒 For your security: Never send money to anyone before visiting our physical yard and inspecting the vehicle.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
