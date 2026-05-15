import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Search, Clock, X } from "lucide-react";
import BrandMarquee from "./BrandMarquee";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "@/lib/recentSearches";

const Footer = () => {
  const navigate = useNavigate();
  const [footerSearch, setFooterSearch] = useState("");
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches("catalogue"));
  const [showRecent, setShowRecent] = useState(false);

  const submitSearch = (term: string) => {
    const q = term.trim();
    if (q) {
      addRecentSearch(q, "catalogue");
      setRecent(getRecentSearches("catalogue"));
    }
    navigate(q ? `/catalogue?search=${encodeURIComponent(q)}` : "/catalogue");
    setShowRecent(false);
  };

  const handleFooterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(footerSearch);
  };

  return (
    <TooltipProvider>
    <footer className="bg-secondary/50 backdrop-blur-sm border-t border-border">
      {/* Quick Search */}
      <div className="container mx-auto px-4 pt-8">
        <form onSubmit={handleFooterSearch} className="max-w-2xl mx-auto flex gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search any car — make, model, year, colour, fuel, stock ID..."
              value={footerSearch}
              onChange={(e) => setFooterSearch(e.target.value)}
              onFocus={() => setShowRecent(true)}
              onBlur={() => setTimeout(() => setShowRecent(false), 150)}
              className="pl-9"
              aria-label="Search vehicles"
            />
            {showRecent && recent.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-72 overflow-y-auto text-left">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground">
                  <span>Recent searches on this device</span>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearRecentSearches("catalogue");
                      setRecent([]);
                    }}
                  >
                    Clear all
                  </button>
                </div>
                {recent.map((term) => (
                  <div
                    key={term}
                    className="flex items-center justify-between px-3 py-2 hover:bg-accent/40 cursor-pointer text-sm"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitSearch(term);
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{term}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${term}`}
                      className="text-muted-foreground hover:text-destructive ml-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeRecentSearch(term, "catalogue");
                        setRecent(getRecentSearches("catalogue"));
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

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
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/videos" className="text-muted-foreground hover:text-accent transition-colors">
                  Videos
                </Link>
              </li>
              <li>
                <Link to="/motorbikes" className="text-muted-foreground hover:text-accent transition-colors">
                  Motorbikes
                </Link>
              </li>
            </ul>
          </div>

          {/* Car By Brands */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Car By Brands</h4>
            <ul className="space-y-2">
              {["Toyota", "BMW", "Mercedes", "Land Rover", "Nissan"].map((b) => (
                <li key={b}>
                  <Link
                    to={`/catalogue?brand=${encodeURIComponent(b)}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {b}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Car By Location - County SEO */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Car By Location</h4>
            <ul className="space-y-2">
              {["Nairobi", "Nyeri", "Kisii", "Kiambu", "Mombasa", "Eldoret"].map((loc) => (
                <li key={loc}>
                  <Link
                    to={`/catalogue?location=${encodeURIComponent(loc)}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {loc} Cars
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Customer Support</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/faqs" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link 
                  to="/help-support" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-use" 
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy-policy" 
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
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-foreground">Connect With Us</h4>
            <div className="flex gap-4 mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://www.facebook.com/justiceultimatemotors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Follow us on Facebook</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-6 w-6" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Follow us on Twitter</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Follow us on Instagram</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-6 w-6" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subscribe on YouTube</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open("https://maps.app.goo.gl/sruXcwwRpCAZrg6i8", "_blank")}
              >
                <MapPin className="h-4 w-4 mr-2" />
                <div className="text-left text-xs">
                  <div>Mpesi Lane 11, Westlands</div>
                  <div>Nairobi, Kenya</div>
                </div>
              </Button>
              
              {/* Personal Brand SEO - Justice Vincent */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open("tel:+254722827458")}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    <div className="text-left text-xs">
                      <div className="font-semibold">Justice Vincent - CEO</div>
                      <div>0722 827 458</div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>CEO - Luxury Car Imports Kenya</p>
                </TooltipContent>
              </Tooltip>

              {/* Personal Brand SEO - Daniel Maina W. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => window.open("tel:+254701460110")}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    <div className="text-left text-xs">
                      <div className="font-semibold">Daniel Maina W. - DevOps</div>
                      <div>0701 460 110</div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>DevOps Engineer - Systems & Infrastructure</p>
                </TooltipContent>
              </Tooltip>
              
              <p className="text-xs italic mt-3 opacity-70">Powered By Daniwest Tech Sol</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p className="text-center md:text-left">
              © 2026 Justice Ultimate Automobiles | Driving Excellence Across Africa & Beyond{" "}
              <span className="text-xs italic opacity-70">V. 2.1.0.0</span>
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
    </TooltipProvider>
  );
};

export default Footer;
