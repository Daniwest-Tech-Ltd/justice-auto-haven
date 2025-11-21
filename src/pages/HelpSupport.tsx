import { Phone, Mail, MapPin, MessageCircle, Shield, FileText, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CertificateModal from "@/components/CertificateModal";

const HelpSupport = () => {
  const [showCertificate, setShowCertificate] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            🆘 Help & Support Center
          </h1>
          <p className="text-xl text-muted-foreground">
            We're here to assist you every step of the way
          </p>
        </div>

        {/* Contact Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="glass-strong hover:scale-105 transition-transform">
            <CardHeader>
              <Phone className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Call us directly</p>
              <a href="tel:+254722827458" className="font-semibold text-primary hover:underline">
                +254 722 827 458
              </a>
              <p className="text-xs text-muted-foreground mt-2">Mon-Sat: 8AM-6PM</p>
            </CardContent>
          </Card>

          <Card className="glass-strong hover:scale-105 transition-transform">
            <CardHeader>
              <Mail className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Send us an email</p>
              <a href="mailto:justicevincentt@gmail.com" className="font-semibold text-primary hover:underline break-all">
                justicevincentt@gmail.com
              </a>
              <p className="text-xs text-muted-foreground mt-2">24-48 hour response</p>
            </CardContent>
          </Card>

          <Card className="glass-strong hover:scale-105 transition-transform">
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Quick messaging</p>
              <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                Chat on WhatsApp
              </a>
              <p className="text-xs text-muted-foreground mt-2">Fast replies</p>
            </CardContent>
          </Card>

          <Card className="glass-strong hover:scale-105 transition-transform">
            <CardHeader>
              <MapPin className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Visit Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Physical location</p>
              <p className="font-semibold text-sm">Mpesi Lane 11<br />Westlands, Nairobi</p>
              <p className="text-xs text-muted-foreground mt-2">Mon-Sat: 8AM-6PM</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification & Authenticity */}
        <Card className="glass-strong mb-12">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Verification & Authenticity</CardTitle>
                <CardDescription>Certified and trusted automotive dealer in Kenya</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground/80">
              Justice Ultimate Automobiles is a fully certified automotive dealer operating with officially recognized business credentials. We are registered, compliant, and committed to transparency.
            </p>
            <div className="bg-background/50 p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-3">Our Official Company Certificate</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View our complete certification including business registration, permits, and compliance documentation.
              </p>
              <Button
                onClick={() => setShowCertificate(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                <FileText className="w-5 h-5" />
                View Company Certificate
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Business Registration</p>
                <p className="font-semibold">✓ Verified</p>
              </div>
              <div className="text-center p-4 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">KRA Compliance</p>
                <p className="font-semibold">✓ Active</p>
              </div>
              <div className="text-center p-4 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">NTSA Licensed</p>
                <p className="font-semibold">✓ Authorized</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Center */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="glass-strong">
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Buying Process Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/80">
                <li>Browse our vehicle catalogue</li>
                <li>Add vehicles to your whitelist</li>
                <li>Submit an order or contact sales</li>
                <li>Schedule vehicle inspection</li>
                <li>Complete secure payment</li>
                <li>Vehicle delivery or collection</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li><strong>M-Pesa:</strong> Send payment to Paybill number (provided)</li>
                <li><strong>Bank Transfer:</strong> Details shared upon order confirmation</li>
                <li><strong>Cash:</strong> Pay at our Westlands office</li>
                <li><strong>Financing:</strong> Apply through our partner institutions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Vehicle Import Process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 mb-3">
                For imported vehicles, we handle the entire process including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                <li>International shipping coordination</li>
                <li>Customs clearance and documentation</li>
                <li>NTSA registration and inspection</li>
                <li>Final delivery to your location</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>After-Sales Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>Warranty coverage on all vehicles</li>
                <li>Free first service (within 30 days)</li>
                <li>Technical support and consultation</li>
                <li>Parts availability assistance</li>
                <li>Trade-in options for upgrades</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Report a Problem */}
        <Card className="glass-strong border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <CardTitle className="text-2xl">Report a Problem</CardTitle>
                <CardDescription>We take all concerns seriously</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-4">
              If you encounter any issues, suspect fraud, need to file a claim, or request a refund, please contact us immediately:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2">Emergency Line</h4>
                <a href="tel:+254722827458" className="text-primary hover:underline">+254 722 827 458</a>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2">Email Support</h4>
                <a href="mailto:justicevincentt@gmail.com" className="text-primary hover:underline break-all">justicevincentt@gmail.com</a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              All reports are handled confidentially and resolved within 24-48 hours.
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/faqs" className="text-primary hover:underline font-semibold">FAQs</a>
            <span className="text-muted-foreground">•</span>
            <a href="/terms-of-use" className="text-primary hover:underline font-semibold">Terms of Use</a>
            <span className="text-muted-foreground">•</span>
            <a href="/privacy-policy" className="text-primary hover:underline font-semibold">Privacy Policy</a>
            <span className="text-muted-foreground">•</span>
            <a href="/cookie-policy" className="text-primary hover:underline font-semibold">Cookie Policy</a>
            <span className="text-muted-foreground">•</span>
            <a href="/about" className="text-primary hover:underline font-semibold">About Us</a>
          </div>
        </div>
      </div>
      
      {/* Certificate Modal */}
      <CertificateModal open={showCertificate} onOpenChange={setShowCertificate} />
    </div>
  );
};

export default HelpSupport;