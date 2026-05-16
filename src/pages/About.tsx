import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ceoImage from "@/assets/ceo.jpg";
import danielImage from "@/assets/daniel-maina.jpg";
import { useState, useEffect } from "react";
import { getCurrentSale } from "@/lib/currentSale";
import CertificateModal from "@/components/CertificateModal";
import {
  Award, FileText, Target, Eye, Globe, Handshake, Car, Package, Sparkles, Cpu,
  BookOpen, Clock, Users, MapPin, Phone, MessageCircle, ShieldCheck, BadgeDollarSign,
  Lock, Search, Building2, FileCheck, Briefcase, Truck, Rocket, User, ChevronRight
} from "lucide-react";

const About = () => {
  const sale = getCurrentSale();
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(100), 50);
    return () => clearTimeout(t);
  }, []);

  const toggleCard = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const SectionTag = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      {children}
    </div>
  );

  return (
    <div className="relative about-page">
      {/* Top tech loading bar */}
      <div className="fixed top-16 left-0 right-0 h-[2px] bg-primary/10 z-40">
        <div
          className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-[2500ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tech grid background overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="container mx-auto px-4 py-12 space-y-20 relative z-10">
        {/* Hero */}
        <section className="text-center">
          <div className="glass-strong rounded-3xl p-12 max-w-5xl mx-auto border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />

            <SectionTag>System // About</SectionTag>
            <div className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm px-5 py-1.5 rounded-full mb-4 animate-pulse font-mono">
              {sale.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              About Justice Ultimate Automobiles{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Trusted Car Dealers in Kenya
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              A trusted dealership in Nairobi delivering quality vehicles, flexible asset financing
              up to 90%, and 3-day approvals — engineered for transparency and speed.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/services">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  Apply for Asset Finance
                </Button>
              </Link>
              <Link to="/catalogue">
                <Button size="lg">View Available Cars</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">Visit Our Showroom</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-6">
          {[
            { Icon: Target, title: "Our Mission", body: "Redefine trust and transparency in vehicle acquisition by connecting customers worldwide with high-quality, affordable cars sourced from Kenya and global markets." },
            { Icon: Eye, title: "Our Vision", body: "Become Africa's most trusted and internationally recognized automobile brand, delivering vehicles across continents with professionalism, precision, and pride." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="glass-strong rounded-2xl p-8 border border-primary/15 hover:border-primary/40 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        {/* Core Values */}
        <section className="glass-strong rounded-3xl p-10 md:p-12 border border-primary/15">
          <div className="text-center mb-10">
            <SectionTag>Core // Values</SectionTag>
            <h2 className="text-4xl font-bold mb-3">Our Operating Principles</h2>
            <p className="text-muted-foreground">Engineered standards that govern every transaction.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { Icon: Globe, title: "Global Reach", desc: "Exporting vehicles to over 60 countries through a seamless international network." },
              { Icon: Handshake, title: "Integrity", desc: "Honest, ethical, and transparent in every transaction we process." },
              { Icon: Car, title: "Quality Assurance", desc: "Every vehicle is inspected and verified before delivery." },
              { Icon: Package, title: "Seamless Logistics", desc: "From port handling to customs clearance — flawless end-to-end logistics." },
              { Icon: Sparkles, title: "Customer Success", desc: "Your satisfaction is our measure of excellence." },
              { Icon: Cpu, title: "Innovation & Tech", desc: "Modern tools, AI systems, and digital dashboards optimize our services." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="glass rounded-xl p-6 border border-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all group">
                <div className="inline-flex p-2.5 rounded-lg bg-primary/10 border border-primary/20 mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Story */}
        <section className="glass-strong rounded-3xl p-10 md:p-12 border border-primary/15">
          <div className="text-center mb-10">
            <SectionTag>Timeline // History</SectionTag>
            <h2 className="text-4xl font-bold mb-3 inline-flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" /> Our Story
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              From humble Nyeri beginnings to global operations — a journey built on dedication, growth, and excellence.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { year: "2015", event: "Founded in Nairobi – Karen" },
              { year: "2021", event: "First cross-border sale to Westlands International Client" },
              { year: "2022", event: "Expanded sourcing and exports to Japan" },
              { year: "2024", event: "Surpassed 10,000 vehicles sold globally" },
              { year: String(sale.year), event: `${sale.short} - Up to 90% Asset Financing` },
            ].map((m) => (
              <div key={m.year} className="relative glass rounded-xl p-5 border border-primary/10 hover:border-primary/40 transition-colors text-center">
                <Clock className="h-4 w-4 text-primary/60 absolute top-3 right-3" />
                <div className="text-3xl font-extrabold font-mono text-primary mb-2">{m.year}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="space-y-10">
          <div className="text-center">
            <SectionTag>Team // Leadership</SectionTag>
            <h2 className="text-4xl font-bold inline-flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" /> Meet Our Leadership & Global Team
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* CEO */}
            <div className="relative h-80 perspective-1000">
              <div
                className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${flippedCards['ceo'] ? 'rotate-y-180' : ''}`}
                onClick={() => toggleCard('ceo')}
              >
                <div className="absolute inset-0 backface-hidden glass-strong rounded-2xl p-6 border border-primary/20 flex flex-col items-center justify-center">
                  <img src={ceoImage} alt="Justice Vincent - CEO" className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4 shadow-[0_0_30px_-5px_hsl(var(--primary))]" />
                  <h3 className="text-xl font-bold">Justice Vincent</h3>
                  <p className="text-sm text-primary font-semibold mb-2">Chief Executive Officer</p>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Kenya / Global Operations</p>
                  <div className="absolute bottom-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest inline-flex items-center gap-1">Tap <ChevronRight className="h-3 w-3" /></div>
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 border border-primary/30 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-3">Justice Vincent</h3>
                    <p className="text-sm text-muted-foreground mb-3">Leads with passion for excellence, integrity, and world-class customer service. Years of experience in global automotive sourcing.</p>
                    <p className="text-xs italic text-muted-foreground">"Committed to delivering vehicles across continents — safely and professionally."</p>
                  </div>
                  <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors inline-flex items-center justify-center gap-2"
                    onClick={(e) => e.stopPropagation()}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp: 0722 827 458
                  </a>
                </div>
              </div>
            </div>

            {/* Admin */}
            <div className="relative h-80 perspective-1000">
              <div
                className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${flippedCards['admin'] ? 'rotate-y-180' : ''}`}
                onClick={() => toggleCard('admin')}
              >
                <div className="absolute inset-0 backface-hidden glass-strong rounded-2xl p-6 border border-primary/20 flex flex-col items-center justify-center">
                  <img src={danielImage} alt="Daniel Maina W." className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4 shadow-[0_0_30px_-5px_hsl(var(--primary))]" />
                  <h3 className="text-xl font-bold">Daniel Maina W.</h3>
                  <p className="text-sm text-primary font-semibold mb-2">System Administrator & DevOps Engineer</p>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Kenya</p>
                  <div className="absolute bottom-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest inline-flex items-center gap-1">Tap <ChevronRight className="h-3 w-3" /></div>
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 border border-primary/30 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Daniel Maina W.</h3>
                    <p className="text-sm text-muted-foreground mb-3">DevOps Engineer, Cybersecurity Specialist, Programmer, and Graphics Designer with 2+ years of professional experience.</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                      <li>System Security</li><li>AI Integrations</li><li>Web & App Development</li><li>Technical Support</li>
                    </ul>
                  </div>
                  <a href="https://wa.me/254701460110" target="_blank" rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors inline-flex items-center justify-center gap-2"
                    onClick={(e) => e.stopPropagation()}>
                    <MessageCircle className="h-4 w-4" /> WhatsApp: 0701 460 110
                  </a>
                </div>
              </div>
            </div>

            {/* Generic team cards */}
            {[
              { id: 'exports', title: 'Head of Exports – Japan Division', loc: 'Japan', body: "Oversees sourcing, inspection, and vehicle verification across Japan's largest auction networks." },
              { id: 'logistics', title: 'Global Logistics Lead', loc: 'Global', body: 'Coordinates international shipping, port operations, customs procedures, and delivery timelines.' },
              { id: 'sales', title: 'Regional Sales Representative', loc: 'Kenya', body: 'Supports customers across Kenya with vehicle sales, showroom assistance, documentation, and after-sales services.' },
            ].map((m) => (
              <div key={m.id} className="relative h-80 perspective-1000">
                <div
                  className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${flippedCards[m.id] ? 'rotate-y-180' : ''}`}
                  onClick={() => toggleCard(m.id)}
                >
                  <div className="absolute inset-0 backface-hidden glass-strong rounded-2xl p-6 border border-primary/20 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary mb-4 flex items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary))]">
                      <User className="h-14 w-14 text-primary/70" />
                    </div>
                    <h3 className="text-xl font-bold">Name Hidden</h3>
                    <p className="text-sm text-primary font-semibold mb-2 text-center">{m.title}</p>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.loc}</p>
                    <div className="absolute bottom-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest inline-flex items-center gap-1">Tap <ChevronRight className="h-3 w-3" /></div>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 border border-primary/30 flex flex-col justify-center">
                    <h3 className="text-lg font-bold mb-3">{m.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{m.body}</p>
                    <p className="text-xs text-primary font-semibold inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="space-y-10">
          <div className="text-center">
            <SectionTag>Trust // Transparency</SectionTag>
            <h2 className="text-4xl font-bold inline-flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" /> Why Thousands Trust Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-3">
              Committed to transparency, security, and exceptional service.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: FileCheck, title: '100% Verified Car History', desc: 'Every vehicle is thoroughly inspected with complete documentation.' },
              { Icon: BadgeDollarSign, title: 'Transparent Pricing', desc: 'No hidden fees. What you see is what you pay, with flexible options.' },
              { Icon: Lock, title: 'Secure Payment Options', desc: 'Bank transfers, mobile money, and online payments with 2FA protection.' },
              { Icon: Search, title: 'Physical Inspections', desc: 'Visit our showroom anytime. See, test, and verify before you buy.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="glass-strong rounded-xl p-6 border border-primary/15 hover:border-primary/40 transition-colors text-center space-y-3">
                <div className="inline-flex p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Credentials */}
          <div className="glass-strong rounded-3xl p-10 md:p-12 border border-primary/15">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-3 inline-flex items-center gap-3">
                <Award className="h-7 w-7 text-primary" /> Company Credentials
              </h3>
              <p className="text-muted-foreground">Verified credentials and official documents — click any tile to view.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Button onClick={() => setShowCertificate(true)} className="gap-2">
                  <Award className="h-4 w-4" /> View Certificate
                </Button>
                <Button onClick={() => setShowCertificate(true)} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" /> View Company Profile
                </Button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {[
                { Icon: Building2, title: 'Certificate of Incorporation', desc: 'Registered & Licensed Business' },
                { Icon: FileText, title: 'Business Permit', desc: 'County Government Approved' },
                { Icon: Briefcase, title: 'KRA Compliance', desc: 'Tax Compliant & PIN Verified' },
                { Icon: Car, title: 'NTSA Dealer License', desc: 'Authorized Motor Vehicle Dealer' },
                { Icon: MapPin, title: 'Physical Office', desc: 'Muthithi Road, Westlands' },
                { Icon: Truck, title: 'Export Certified', desc: 'International Trade License' },
              ].map(({ Icon, title, desc }) => (
                <button key={title} onClick={() => setShowCertificate(true)}
                  className="glass rounded-xl p-5 text-left border border-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all space-y-2 group">
                  <div className="inline-flex p-2.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-bold">{title}</h4>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="glass-strong rounded-3xl p-8 border border-primary/15">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="inline-flex p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2">Visit Our Showroom</h4>
                <p className="text-sm text-muted-foreground">Mpesi Lane 11, Westlands<br />Nairobi, Kenya</p>
                <a href="https://maps.google.com/?q=Mpesi+Lane+11+Westlands+Nairobi" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 inline-block">View on Google Maps</a>
              </div>
              <div>
                <div className="inline-flex p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2">24/7 Customer Support</h4>
                <p className="text-sm text-muted-foreground mb-2">Call us anytime for inquiries</p>
                <a href="tel:+254722827458" className="text-primary font-semibold hover:underline">+254 722 827 458</a>
              </div>
              <div>
                <div className="inline-flex p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2">WhatsApp Direct</h4>
                <p className="text-sm text-muted-foreground mb-2">Chat with our team instantly</p>
                <a href="https://wa.me/254722827458" target="_blank" rel="noopener noreferrer"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg transition-colors">
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="glass-strong rounded-3xl p-12 text-center border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
          <div className="relative">
            <SectionTag>Initialize // Engagement</SectionTag>
            <h2 className="text-4xl font-bold mb-6 inline-flex items-center gap-3">
              <Rocket className="h-8 w-8 text-primary" /> Ready to Drive With Us?
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact"><Button size="lg">Contact Our Global Sales Team</Button></Link>
              <Link to="/catalogue"><Button size="lg" variant="outline">View International Stock</Button></Link>
            </div>
          </div>
        </section>

        <CertificateModal open={showCertificate} onOpenChange={setShowCertificate} />
      </div>
    </div>
  );
};

export default About;
