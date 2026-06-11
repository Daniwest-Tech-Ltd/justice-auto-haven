import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  Building2,
  Headphones,
  ShoppingBag,
  User,
  ShieldCheck,
  Globe,
  Navigation,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSale } from "@/lib/currentSale";
import HeroSlider from "@/components/HeroSlider";

const Contact = () => {
  const sale = getCurrentSale();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }]);

      if (error) throw error;

      const { data: adminData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminData) {
        await supabase.from("notifications").insert({
          user_id: adminData.user_id,
          title: "New Contact Submission",
          message: `${formData.name} sent a message: ${formData.subject}`,
          type: "contact",
        });
      }

      toast({ title: "Message Sent!", description: "We'll get back to you as soon as possible." });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to send message.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Official Trust Bar */}
      <div className="bg-primary py-2 relative z-30 border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-4 flex justify-center items-center gap-10 whitespace-nowrap overflow-hidden">
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3 text-brand-red" />
            Direct Communication Terminal
          </span>
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <Globe className="h-3 w-3 text-brand-red" />
            Nationwide Support Network
          </span>
        </div>
      </div>

      {/* Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Desk: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Corporate <span className="text-brand-red">Contact Room.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Initiate a direct query with our executive desk. We provide authoritative support for car sales, rentals, asset financing, and trade-in audits. <br className="hidden md:block" /> Mean response turnaround: 60 business minutes.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Communication Channel */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="rounded-md border-border bg-background shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Dispatch Message</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Full Legal Name</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Professional Email</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Contact Number</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        type="tel"
                        placeholder="07XX XXX XXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider">Subject Matter</Label>
                      <Input
                        className="h-10 rounded-sm text-xs"
                        placeholder="e.g., Asset Finance Inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Detailed Message</Label>
                    <Textarea
                      className="rounded-sm text-xs min-h-[150px]"
                      placeholder="Specify the details of your inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full h-12 rounded-md bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl btn-signal">
                    {submitting ? "Transmitting..." : "Send Dispatch"}
                  </Button>
                </CardContent>
              </Card>

              {/* Departments - Marketplace Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Mail, label: "General", email: "info@justiceultimateautomobiles.com" },
                  { icon: Headphones, label: "Support", email: "support@justiceultimateautomobiles.com" },
                  { icon: ShoppingBag, label: "Sales", email: "sales@justiceultimateautomobiles.com" }
                ].map((dept, i) => (
                  <Card key={i} className="border-border bg-secondary/5 group hover:bg-secondary/10 transition-colors">
                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                      <dept.icon className="h-4 w-4 text-primary" />
                      <p className="text-[9px] font-black uppercase tracking-tight">{dept.label}</p>
                      <a href={`mailto:${dept.email}`} className="text-[8px] font-bold text-muted-foreground hover:text-brand-red break-all uppercase">{dept.email}</a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </form>
          </div>

          {/* Business Support Sidebar */}
          <div className="space-y-6">
            {/* Executive Contacts */}
            <Card className="rounded-md border-border bg-secondary/5">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Executive Registry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {[
                  { icon: Phone, title: "Main Sales Line", val: "0751 555 544", href: "tel:+254751555544" },
                  { icon: User, title: "Justice Vincent (CEO)", val: "0722 827 458", href: "tel:+254722827458" },
                  { icon: Headphones, title: "Daniel Maina (Admin)", val: "0701 460 110", href: "tel:+254701460110" }
                ].map((contact, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div className="h-8 w-8 rounded bg-background border border-border flex items-center justify-center shrink-0">
                      <contact.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground">{contact.title}</p>
                      <a href={contact.href} className="text-[11px] font-black uppercase tracking-tighter hover:text-brand-red transition-colors">{contact.val}</a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Strategic Location */}
            <Card className="rounded-md border-border bg-background shadow-sm overflow-hidden group">
              <div className="h-32 bg-secondary/20 relative flex items-center justify-center overflow-hidden">
                 <MapPin className="h-10 w-10 text-brand-red opacity-20 absolute" />
                 <Navigation className="h-5 w-5 text-primary animate-pulse relative z-10" />
              </div>
              <CardContent className="p-5 space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary">Headquarters</p>
                 <p className="text-[11px] font-bold uppercase leading-relaxed">Muthithi Road, Westlands<br />Nairobi, Kenya</p>
                 <Button
                   variant="outline"
                   className="w-full h-10 text-[9px] font-black uppercase tracking-[0.2em] rounded-sm group-hover:bg-primary group-hover:text-white transition-all"
                   onClick={() => window.open("https://maps.app.goo.gl/7x51yn7VHwHfpEpV8")}
                 >
                   View Strategic Hub
                 </Button>
              </CardContent>
            </Card>

            {/* Operational Hours */}
            <Card className="rounded-md border-border bg-secondary/5">
               <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Operational Cycle</CardTitle>
               </CardHeader>
               <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-3">
                     <Clock className="h-4 w-4 text-primary" />
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nairobi (EAT)</p>
                        <p className="text-[10px] font-black uppercase">8AM – 6PM, MON–SAT</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                     <Clock className="h-4 w-4 text-muted-foreground" />
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest">London (GMT)</p>
                        <p className="text-[10px] font-black uppercase">7AM – 5PM, MON–FRI</p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Quick WhatsApp Audit */}
            <Card className="rounded-md border-border bg-primary text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
              <CardContent className="pt-8 pb-6 text-center space-y-4 relative z-10">
                <div className="h-10 w-10 bg-white/10 rounded-full mx-auto flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-brand-red" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-sm font-black uppercase tracking-widest">Support Desk</h3>
                   <p className="text-[9px] font-bold uppercase opacity-70">Direct expert consultation</p>
                </div>
                <p className="text-xl font-black font-mono tracking-tighter">+254 722 827 458</p>
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-[10px] font-black uppercase tracking-widest h-10 rounded-sm hover:bg-white hover:text-primary transition-all"
                  onClick={() => window.open("https://wa.me/254722827458")}
                >
                  Initiate WhatsApp Query
                </Button>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full h-12 rounded-md border-border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-secondary"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-3 w-3" /> Return to Terminal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
