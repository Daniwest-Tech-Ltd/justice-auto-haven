import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">📞 Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          Get in touch with our global team. We're here to help with all your automotive needs, from sales to support.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="glass-strong rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <Input placeholder="Full Name" />
            </div>
            <div>
              <Input type="email" placeholder="Email Address" />
            </div>
            <div>
              <Input type="tel" placeholder="Phone Number" />
            </div>
            <div>
              <Input placeholder="Subject" />
            </div>
            <div>
              <Textarea placeholder="Message" rows={6} />
            </div>
            <div>
              <Input type="file" />
            </div>
            <Button className="w-full" size="lg">
              Send Message
            </Button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Location */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">📍 Headquarters</h3>
                <p className="text-muted-foreground">
                  Mpesi Lane 11, Westlands<br />
                  Nairobi, Kenya
                </p>
                <Button variant="link" className="px-0 mt-2">
                  Get Directions →
                </Button>
              </div>
            </div>
          </div>

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

            <a href="mailto:justicevincentt@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">Email</div>
                <div>justicevincentt@gmail.com</div>
              </div>
            </a>
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

          {/* Departments */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Departments</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">📩 Sales:</span>
                <span>sales@justiceultimate.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">💁 Support:</span>
                <span>support@justiceultimate.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🔧 Service:</span>
                <span>service@justiceultimate.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-strong rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg">View Cars</Button>
          <Button size="lg" variant="outline">💳 Financing</Button>
        </div>
      </div>
    </div>
  );
};

export default Contact;
