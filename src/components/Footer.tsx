import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import BrandMarquee from "./BrandMarquee";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 backdrop-blur-sm border-t border-border">
      {/* Brand Marquee */}
      <div className="container mx-auto px-4 py-8">
        <h3 className="text-xl font-semibold text-center mb-4 text-foreground">Our Trusted Partners</h3>
        <BrandMarquee />
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* About Company */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">About Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-accent transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/videos" className="text-muted-foreground hover:text-accent transition-colors">
                  Videos
                </Link>
              </li>
            </ul>
          </div>

          {/* Car By Brands */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Car By Brands</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/catalogue?brand=Toyota" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Toyota
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue?brand=BMW" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  BMW
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue?brand=Mercedes" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Mercedes
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue?brand=Land Rover" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Land Rover
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue?brand=Nissan" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Nissan
                </Link>
              </li>
            </ul>
          </div>

          {/* Car By Location */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Car By Location</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/catalogue" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Nairobi
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Mombasa
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Japan Imports
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalogue" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  UK Imports
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Customer Support</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/terms" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookie-policy" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    document.cookie = "cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    window.location.reload();
                  }}
                  className="text-muted-foreground hover:text-accent transition-colors text-left"
                >
                  🍪 Manage Cookies
                </button>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Connect With Us</h4>
            <div className="flex gap-4 mb-6">
              <a
                href="https://www.facebook.com/justiceultimatemotors"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📍 Mpesi Lane 11, Westlands</p>
              <p>Nairobi, Kenya</p>
              <p>📞 +254 722 827 458</p>
              <p className="text-xs italic mt-2 opacity-70">Powered By Daniwest Tech Sol</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p className="text-center md:text-left">
              © 2025 Justice Ultimate Automobiles | Driving Excellence Across Africa & Beyond{" "}
              <span className="text-xs italic opacity-70">V. 2.0.0.1</span>
            </p>
            <p className="text-center md:text-right">
              Developed by{" "}
              <a
                href="https://github.com/maishdan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Daniwest Technologies
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
