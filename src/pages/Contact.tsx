import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
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

      // Create notification for admin
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

      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Contact Justice Ultimate Automobiles | Nairobi Car Dealership</h1>
        <p className="text-lg text-muted-foreground">
          Get in touch with Kenya's most trusted car dealership. Contact us for car sales, rentals, trade-ins, and inquiries. Available in Nairobi, Nyeri, Kisii & nationwide.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="glass rounded-lg p-4">
            <p className="text-sm font-semibold mb-1">Justice Vincent - General Manager</p>
            <a href="tel:+254722827458" className="text-accent hover:underline font-bold text-lg">0722 827 458</a>
          </div>
          <div className="glass rounded-lg p-4">
            <p className="text-sm font-semibold mb-1">Daniel Maina - Sales Manager</p>
            <a href="tel:+254701460110" className="text-accent hover:underline font-bold text-lg">0701 460 110</a>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="glass-strong rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Input
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <Textarea
                placeholder="Message"
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
            <Button className="w-full" size="lg" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Location */}
          <a 
            href="https://maps.app.goo.gl/spVusF8WkEfe7pZx5" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-strong rounded-2xl p-6 block hover:scale-105 transition-transform"
          >
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">📍 Headquarters</h3>
                <p className="text-muted-foreground">
                  Mpesi Lane 11, Westlands<br />
                  Nairobi, Kenya
                </p>
                <p className="text-primary text-sm mt-2">Click to view on map →</p>
              </div>
            </div>
          </a>

          {/* Contact Methods */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
            
            <a href="tel:+254722827458" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">Phone / SMS</div>
                <div>+254 722 827 458</div>
              </div>
            </a>

            <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">WhatsApp</div>
                <div>+254 722 827 458</div>
              </div>
            </a>

            <a href="mailto:info@justiceultimateautomobiles.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">General Inquiries</div>
                <div>info@justiceultimateautomobiles.com</div>
              </div>
            </a>
          </div>

          {/* Departments */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Departments</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <a href="mailto:info@justiceultimateautomobiles.com">
                  <Mail className="h-4 w-4" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">📩 General Inquiries</p>
                    <p className="text-xs text-muted-foreground">info@justiceultimateautomobiles.com</p>
                  </div>
                </a>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <a href="mailto:support@justiceultimateautomobiles.com">
                  <Mail className="h-4 w-4" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">💁 Support</p>
                    <p className="text-xs text-muted-foreground">support@justiceultimateautomobiles.com</p>
                  </div>
                </a>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <a href="mailto:sales@justiceultimateautomobiles.com">
                  <Mail className="h-4 w-4" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">🔧 Sales</p>
                    <p className="text-xs text-muted-foreground">sales@justiceultimateautomobiles.com</p>
                  </div>
                </a>
              </Button>
            </div>
          </div>

          {/* Office Hours */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Office Hours</h3>
                <p className="text-muted-foreground">
                  ⏰ Nairobi (EAT): 8AM – 6PM, Mon–Sat<br />
                  ⏰ London (GMT): 7AM – 5PM, Mon–Fri
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
