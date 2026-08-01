import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Search, Clock, X, Headphones, Smartphone, Mail, Globe, ArrowRight, Shield, Download, Trophy, Activity } from "lucide-react";
import BrandMarquee from "./BrandMarquee";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import logo from "@/assets/logo.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  getRecentSearches,
  addRecentSearch,
} from "@/lib/recentSearches";

const Footer = () => {
  const navigate = useNavigate();
  const [footerSearch, setFooterSearch] = useState("");
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches("catalogue"));

  const submitSearch = (term: string) => {
    const q = term.trim();
    if (q) {
      addRecentSearch(q, "catalogue");
    }
    navigate(q ? `/catalogue?search=${encodeURIComponent(q)}` : "/catalogue");
  };

  const handleFooterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(footerSearch);
  };

  return (
    <TooltipProvider>
    <footer className="bg-background border-t border-border relative z-10 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* Brand & Market Partners Strip */}
      <div className="border-b border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Market Dominance</h3>
              <p className="text-2xl font-black tracking-tighter uppercase">Strategic Corporate Alliances</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-5 py-2 border-brand-red/30 bg-brand-red/5 text-brand-red text-[10px] font-black uppercase tracking-widest">NTSA Verified</Badge>
              <Badge variant="outline" className="px-5 py-2 border-primary/30 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">KRA Compliant</Badge>
              <Badge variant="outline" className="px-5 py-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">KEBS Certified</Badge>
            </div>
          </div>
          <BrandMarquee />
        </div>
      </div>

      {/* Main Professional Grid */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16">

          {/* Brand Identity & Newsletter */}
          <div className="lg:col-span-4 space-y-10">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-3 group">
                <img src={logo} alt="Justice Ultimate" className="h-14 w-14 object-contain transition-transform duration-500 group-hover:scale-110" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter leading-none">JUSTICE ULTIMATE</span>
                  <span className="text-[10px] font-black tracking-[0.5em] uppercase text-brand-red">Automobiles</span>
                </div>
              </Link>
              <p className="text-[11px] text-muted-foreground leading-loose font-bold uppercase tracking-wider max-w-sm">
                Africa's premier automotive transactional terminal. specializing in high-fidelity Japanese imports, corporate fleet scaling, and encrypted logistics management.
              </p>
            </div>

            <form onSubmit={handleFooterSearch} className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Inventory Audit Search</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-red" />
                  <Input
                    type="search"
                    placeholder="VIN, MAKE OR MODEL..."
                    className="h-12 pl-12 rounded-sm bg-secondary/30 border-border focus:border-brand-red/50 text-[10px] font-black uppercase tracking-widest"
                    value={footerSearch}
                    onChange={(e) => setFooterSearch(e.target.value)}
                  />
                </div>
                <Button type="submit" className="h-12 px-8 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] bg-brand-red hover:bg-brand-red/90 shadow-xl transition-all">Query</Button>
              </div>
            </form>
          </div>

          {/* Business Units */}
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Business Units</h4>
            <ul className="space-y-4">
              {[
                { to: "/catalogue", label: "Asset Inventory" },
                { to: "/asset-finance", label: "Financing Desk" },
                { to: "/trade-in", label: "Trade-In Portal" },
                { to: "/motorbikes", label: "Motorbike Fleet" },
                { to: "/videos", label: "Visual Yard Audit" }
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-[11px] font-black text-muted-foreground hover:text-brand-red transition-all flex items-center group uppercase tracking-widest">
                    <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-red" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Regional Hubs */}
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Regional Hubs</h4>
            <ul className="space-y-4">
              {["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nyeri", "Kisii"].map((loc) => (
                <li key={loc}>
                  <Link to={`/catalogue?location=${loc}`} className="text-[11px] font-black text-muted-foreground hover:text-brand-red transition-all flex items-center group uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-2 text-muted-foreground/30 group-hover:text-brand-red transition-colors" />
                    {loc} Operations
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Governance & Support */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-secondary/10 p-8 rounded-md border border-border space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-brand-red/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-red/10 transition-colors" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Executive Support</h4>

              <div className="space-y-6">
                <a href="tel:+254722827458" className="flex items-center gap-5 group/item cursor-pointer">
                  <div className="h-12 w-12 rounded bg-background border border-border flex items-center justify-center shrink-0 shadow-sm group-hover/item:border-brand-red/50 group-hover/item:bg-brand-red/5 transition-all">
                    <Phone className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">24/7 Corporate Line</p>
                    <p className="text-base font-black tracking-tighter group-hover/item:text-brand-red transition-colors">+254 722 827 458</p>
                  </div>
                </a>

                <a href="mailto:info@justiceultimateautomobiles.com" className="flex items-center gap-5 group/item cursor-pointer">
                  <div className="h-12 w-12 rounded bg-background border border-border flex items-center justify-center shrink-0 shadow-sm group-hover/item:border-brand-red/50 group-hover/item:bg-brand-red/5 transition-all">
                    <Mail className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Direct Dispatch</p>
                    <p className="text-[11px] font-black uppercase tracking-tighter truncate max-w-[200px] group-hover/item:text-brand-red transition-colors">info@justiceultimateautomobiles.com</p>
                  </div>
                </a>

                <a href="https://maps.app.goo.gl/7x51yn7VHwHfpEpV8" target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 group/item cursor-pointer">
                  <div className="h-12 w-12 rounded bg-background border border-border flex items-center justify-center shrink-0 shadow-sm group-hover/item:border-brand-red/50 group-hover/item:bg-brand-red/5 transition-all">
                    <MapPin className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Institutional Hub</p>
                    <p className="text-[11px] font-black uppercase tracking-tighter group-hover/item:text-brand-red transition-colors">Westlands, Nairobi, Kenya</p>
                  </div>
                </a>
              </div>

              <div className="flex gap-4 pt-2">
                {[
                  { icon: Facebook, href: "https://facebook.com" },
                  { icon: Instagram, href: "https://instagram.com" },
                  { icon: Twitter, href: "https://twitter.com" },
                  { icon: Youtube, href: "https://youtube.com" }
                ].map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noreferrer" className="h-11 w-11 rounded bg-background hover:bg-brand-red hover:text-white transition-all flex items-center justify-center border border-border shadow-sm group/social">
                    <social.icon className="h-4 w-4 transition-transform group-hover/social:scale-110" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Compliance & Mobile Bar */}
      <div className="border-t border-border bg-secondary/5">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-10 gap-y-6">
              {[
                { label: "Terms of Engagement", path: "/terms" },
                { label: "Data Privacy", path: "/privacy" },
                { label: "Support Terminal", path: "/support" },
                { label: "Help Center", path: "/help-center" },
                { label: "Book Appointment", path: "/appoint" },
                { label: "Compliance Hub", path: "/compliance-hub" },
                { label: "Technical FAQs", path: "/faqs" }
              ].map((item) => (
                <Link key={item.label} to={item.path} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-red transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="flex flex-col items-center lg:items-end gap-2 relative">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.open("https://loadly.io/justice-auto-app", "_blank")}
                  className="relative h-12 px-8 rounded-md bg-background border-brand-red/50 hover:bg-brand-red hover:text-white transition-all gap-3 shadow-xl animate-vertical-bounce overflow-visible group"
                >
                  <Download className="h-5 w-5 text-brand-red group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">v2.1.0 Mobile Download</span>

                  {/* Signal Effects */}
                  <span className="absolute inset-0 rounded-md animate-ping-slow border border-brand-red/30 pointer-events-none" />
                  <span className="absolute -inset-1 rounded-md animate-ping border border-brand-red/20 pointer-events-none" />
                </Button>
                <div className="flex items-center gap-2">
                   <p className="text-[9px] font-black text-brand-red italic tracking-[0.3em] uppercase">V 3.1.0 Status: Active</p>
                   <Trophy className="h-3 w-3 text-brand-red fill-brand-red animate-pulse" />
                </div>
              </div>

              <div className="flex flex-col items-center lg:items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 italic flex items-center gap-1">
                   <Globe className="h-2.5 w-2.5" /> Powered by Online World kenya
                </p>
                <a href="https://onlineworldkenya.vercel.app" target="_blank" rel="noopener noreferrer" className="group">
                   <p className="text-[11px] font-black text-foreground hover:text-brand-red transition-colors uppercase tracking-widest italic">Online World Kenya</p>
                   <div className="h-0.5 w-0 group-hover:w-full bg-brand-red transition-all duration-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Companies Hub - Glassmorphism Integration */}
      <div className="bg-background py-6 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-30" />
        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <div className="glass-strong p-4 px-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 transition-all hover:border-brand-red/20 group">
             <div className="flex items-center gap-3">
                <div className="h-[1px] w-4 bg-muted-foreground/30" />
                <h4 className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/60 group-hover:text-brand-red transition-colors">Our Companies</h4>
                <div className="h-[1px] w-4 bg-muted-foreground/30" />
             </div>
             <div className="flex items-center gap-12">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href="https://www.justiceautomotive.co.ke" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-500 filter grayscale hover:grayscale-0 opacity-60 hover:opacity-100">
                       <img src="/companies/Justice Automotive Kenya.png" alt="Justice Automotive Kenya" className="h-8 md:h-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] uppercase font-bold">Justice Automotive Kenya</p>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-[1px] bg-border/50 rotate-12" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href="https://www.justicecorporatelogistics.co.ke" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all duration-500 filter grayscale hover:grayscale-0 opacity-60 hover:opacity-100">
                       <img src="/companies/Justice Corporate Kenya.png" alt="Justice Corporate Logistics Kenya" className="h-8 md:h-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] uppercase font-bold">Justice Corporate Logistics Kenya</p>
                  </TooltipContent>
                </Tooltip>
             </div>
          </div>
        </div>
      </div>

      {/* Corporate Copyright Bar */}
      <div className="bg-background py-8 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
          <div className="flex items-center gap-3">
             <Shield className="h-4 w-4 text-brand-red" />
             <p>© 2026 Justice Ultimate Automobiles. Institutional Asset Management Division.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary/10 rounded-full border border-border">
            <Activity className="h-3 w-3 text-brand-red animate-pulse" />
            <span className="text-[8px] tracking-[0.2em]">Encrypted Terminal active</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vertical-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-vertical-bounce {
          animation: vertical-bounce 2s infinite ease-in-out;
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          70%, 100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </footer>
    </TooltipProvider>
  );
};

export default Footer;
