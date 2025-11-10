import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import BrandMarquee from "./BrandMarquee";

const Footer = () => {
  return (
    <footer className="glass border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Justice Ultimate Automobiles" className="h-12 w-12 object-contain" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Justice Ultimate</h3>
                <p className="text-sm text-muted-foreground">Automobiles</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted partner for premium automotive solutions across Africa and beyond.
            </p>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                📜 Terms of Use
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                🔒 Privacy Policy
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                🍪 Cookie Policy
              </a>
            </div>
          </div>

          {/* Our Services */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Our Services</h3>
            <div className="space-y-2">
              <Link to="/catalogue" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                🚗 Vehicle Catalogue
              </Link>
              <Link to="/services" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                📅 Test Drive Booking
              </Link>
              <Link to="/services" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                🔑 Car Rentals
              </Link>
              <Link to="/videos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                🎥 Video Showcase
              </Link>
              <Link to="/services" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                🔧 Auto Services
              </Link>
            </div>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Connect With Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <p className="text-sm text-muted-foreground">
                    Mpesi Lane 11, Westlands<br />Nairobi, Kenya
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Contact</p>
                  <a href="tel:+254722827458" className="text-sm text-muted-foreground hover:text-primary">
                    +254 722 827 458
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <a href="mailto:justicevincentt@gmail.com" className="text-sm text-muted-foreground hover:text-primary">
                    justicevincentt@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <a
                  href="https://wa.me/254722827458"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Chat with us
                </a>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Follow Us</p>
                <div className="flex gap-2">
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full bg-blue-400 hover:bg-blue-500 flex items-center justify-center transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-700 flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-4 w-4 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Partners Marquee */}
        <div className="border-t border-white/10 mt-8 pt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Our Trusted Partners</h3>
          <BrandMarquee />
        </div>

        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 Justice Ultimate Automobiles. All rights reserved.<br />
              Driving excellence across Africa and beyond 🌍
            </p>
            <p className="text-sm text-muted-foreground">
              Developed by{" "}
              <a 
                href="https://github.com/maishdan" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                Daniwest Tech Sol
              </a>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span>🚗 Premium Automotive Solutions</span>
            <span>|</span>
            <span>🔒 Secure Transactions</span>
            <span>|</span>
            <span>🌟 Customer Excellence</span>
            <span>|</span>
            <span>🚀 AI-Powered Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
