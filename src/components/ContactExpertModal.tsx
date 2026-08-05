import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, User, Mail, Phone, MessageSquare, CheckCircle, Headphones } from "lucide-react";

interface ContactExpertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carInfo?: string;
}

const ContactExpertModal = ({ open, onOpenChange, carInfo }: ContactExpertModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: carInfo ? `I am interested in: ${carInfo}. Please provide more details.` : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: carInfo ? `Asset Inquiry: ${carInfo}` : "Expert Consultation",
        message: formData.message,
        status: "pending"
      });

      if (error) throw error;

      // Notify Admin
      const { data: adminData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (adminData) {
        await supabase.from("notifications").insert({
          user_id: adminData.user_id,
          title: "New Expert Inquiry",
          message: `${formData.name} requested expert advice regarding ${carInfo || 'general inquiry'}.`,
          type: "contact",
        });
      }

      setSuccess(true);
      toast({
        title: "Message Transmitted",
        description: "Your inquiry has been logged in our terminal.",
      });

      // Reset form after some time
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: "", email: "", phone: "", message: "" });
        onOpenChange(false);
      }, 5000);

    } catch (err: any) {
      toast({
        title: "Transmission Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden glass-strong border-white/10 sm:rounded-2xl">
        <div className="bg-slate-900 p-6 text-white relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-red flex items-center justify-center">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">Ask an <span className="text-brand-red">Expert.</span></DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technical Advisory Desk</DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-8">
          {success ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-600">Transmission Successful</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-xs">
                Your inquiry has been successfully indexed. An automotive expert will contact you shortly.
              </p>
              <div className="pt-8 w-full border-t border-border mt-8">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-4">Immediate Assistance</p>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-black text-foreground tabular-nums">0722 827 458 / 0751 555 544</p>
                  <p className="text-[8px] font-bold text-brand-red uppercase tracking-widest">WhatsApp • SMS • Voice</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Legal Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    className="pl-10 h-12 bg-secondary/20 border-border text-sm font-bold"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      required
                      type="email"
                      className="pl-10 h-12 bg-secondary/20 border-border text-sm font-bold"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      required
                      className="pl-10 h-12 bg-secondary/20 border-border text-sm font-bold"
                      placeholder="07XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Inquiry</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Textarea
                    required
                    rows={4}
                    className="pl-10 pt-3 bg-secondary/20 border-border text-sm font-bold resize-none"
                    placeholder="Tell us what you need..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-slate-900 hover:bg-brand-red text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-xl transition-all duration-500 shadow-xl"
              >
                {loading ? "Transmitting..." : "Initialize Consultation"}
              </Button>

              <div className="pt-4 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Direct technical lines: <span className="text-foreground">0722 827 458 / 0751 555 544</span>
                </p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactExpertModal;
