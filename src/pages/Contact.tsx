import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Clock, Send, Building2, Headphones, ShoppingBag, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSale } from "@/lib/currentSale";

const Contact = () => {
  const sale = getCurrentSale();
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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const contactCards = [
    {
      icon: Phone,
      title: "Main Sales Line",
      value: "0751 555 544",
      href: "tel:+254751555544",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: User,
      title: "Justice Vincent — CEO",
      value: "0722 827 458",
      href: "tel:+254722827458",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    {
      icon: Headphones,
      title: "Daniel Maina — System Admin",
      value: "0701 460 110",
      href: "tel:+254701460110",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
  ];

  const departments = [
    { icon: Mail, label: "General Inquiries", email: "info@justiceultimateautomobiles.com", color: "text-blue-500" },
    { icon: Headphones, label: "Customer Support", email: "support@justiceultimateautomobiles.com", color: "text-green-500" },
    { icon: ShoppingBag, label: "Sales Department", email: "sales@justiceultimateautomobiles.com", color: "text-amber-500" },
    { icon: User, label: "CEO Direct", email: "justicevincentt@gmail.com", color: "text-purple-500" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Hero Header */}
      <section className="relative">
        <div className="glass-strong rounded-3xl p-8 md:p-12 max-w-5xl mx-auto text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative">
            <div className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm md:text-base px-5 py-2 rounded-full mb-4 animate-pulse shadow-lg">
              {sale.banner}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Get in Touch with Justice Ultimate Automobiles
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Kenya's most trusted car dealership. Up to 90% asset financing with 3-day approvals. Reach our team for sales,
              rentals, trade-ins, and inquiries — based in Westlands, Nairobi.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="grid md:grid-cols-3 gap-5">
        {contactCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            className={`group relative overflow-hidden glass-strong rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-80 transition-opacity`} />
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <card.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">{card.title}</p>
                <p className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{card.value}</p>
              </div>
            </div>
          </a>
        ))}
      </section>

      {/* Main Grid: Form + Info */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Contact Form (3 cols) */}
        <div className="lg:col-span-3">
          <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Send us a Message</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">We typically respond within 1 hour during business hours.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Full Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-background/60 backdrop-blur-sm"
                  />
                  <Input
                    type="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-background/60 backdrop-blur-sm"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-background/60 backdrop-blur-sm"
                  />
                  <Input
                    placeholder="Subject *"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="bg-background/60 backdrop-blur-sm"
                  />
                </div>
                <Textarea
                  placeholder="Your Message *"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="bg-background/60 backdrop-blur-sm resize-none"
                />
                <Button className="w-full gap-2" size="lg" type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : <>Send Message <Send className="h-4 w-4" /></>}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Location */}
          <a
            href="https://maps.app.goo.gl/spVusF8WkEfe7pZx5"
            target="_blank"
            rel="noopener noreferrer"
            className="block glass-strong rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Headquarters</h3>
                <p className="text-sm text-muted-foreground">Muthithi Road, Westlands<br />Nairobi, Kenya</p>
                <p className="text-xs text-primary mt-2 group-hover:underline">View on Google Maps →</p>
              </div>
            </div>
          </a>

          {/* Quick Reach */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" /> Quick Reach
            </h3>
            <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-semibold">+254 722 827 458</p>
              </div>
            </a>
            <a href="tel:+254722827458" className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
              <Phone className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone / SMS</p>
                <p className="font-semibold">+254 722 827 458</p>
              </div>
            </a>
          </div>

          {/* Office Hours */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">Office Hours</h3>
                <p className="text-sm text-muted-foreground">⏰ Nairobi (EAT): 8AM – 6PM, Mon–Sat</p>
                <p className="text-sm text-muted-foreground">⏰ London (GMT): 7AM – 5PM, Mon–Fri</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Section */}
      <section className="glass-strong rounded-3xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Building2 className="h-7 w-7 text-primary" />
            <h2 className="text-3xl font-bold">Departments</h2>
          </div>
          <p className="text-muted-foreground">Reach the right team directly via email</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {departments.map((dept) => (
            <a
              key={dept.email}
              href={`mailto:${dept.email}`}
              className="group glass rounded-xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300 hover:shadow-lg"
            >
              <div className="h-12 w-12 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <dept.icon className={`h-6 w-6 ${dept.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold mb-0.5">{dept.label}</p>
                <p className="text-sm text-muted-foreground truncate group-hover:text-primary transition-colors">{dept.email}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contact;
