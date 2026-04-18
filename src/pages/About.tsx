import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ceoImage from "@/assets/ceo.jpg";
import danielImage from "@/assets/daniel-maina.jpg";
import { useState } from "react";
import { getCurrentSale } from "@/lib/currentSale";

const About = () => {
  const sale = getCurrentSale();
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

  const toggleCard = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
          <div className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-6 py-2 rounded-full mb-4 animate-pulse">
            {sale.badge}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About Justice Ultimate Automobiles | <span className="bg-gradient-accent bg-clip-text text-transparent">Trusted Car Dealers in Kenya</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Justice Ultimate Automobiles is a trusted car dealership in Nairobi offering quality vehicles, 
            flexible asset financing (up to 90%), and fast 3-day approvals. We serve salaried individuals 
            and business owners with transparent processes and excellent customer support.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/services">
              <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">Apply for Asset Finance</Button>
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
      <section className="grid md:grid-cols-2 gap-8">
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-4">🎯 Our Mission</h2>
          <p className="text-muted-foreground">
            To redefine trust and transparency in vehicle acquisition by connecting customers worldwide with high-quality, affordable cars sourced from Kenya and global markets.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-4">🌟 Our Vision</h2>
          <p className="text-muted-foreground">
            To become Africa's most trusted and internationally recognized automobile brand, delivering vehicles across continents with professionalism, precision, and pride.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="glass-strong rounded-3xl p-12">
        <h2 className="text-4xl font-bold mb-8 text-center">💎 Our Core Values</h2>
        <p className="text-lg text-muted-foreground text-center mb-8">
          These principles guide our daily operations and define how we serve every customer
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: "🌐", title: "Global Reach", desc: "We export vehicles to over 60+ countries through a seamless international network." },
            { icon: "🤝", title: "Integrity", desc: "We maintain honesty, ethics, and transparency in every transaction." },
            { icon: "🚗", title: "Quality Assurance", desc: "Every vehicle undergoes strict inspection and verification before delivery." },
            { icon: "📦", title: "Seamless Logistics", desc: "From port handling to customs clearance—our logistics are flawless." },
            { icon: "🌟", title: "Customer Success", desc: "Your satisfaction is our measure of excellence." },
            { icon: "⚙️", title: "Innovation & Tech", desc: "We integrate modern tools, AI systems, and digital dashboards to optimize our services." },
          ].map((value) => (
            <div key={value.title} className="text-center glass rounded-xl p-6">
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="text-lg font-bold mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="glass-strong rounded-3xl p-12">
        <h2 className="text-4xl font-bold mb-8 text-center">📖 Our Story</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12 text-center">
          Justice Ultimate Automobiles began in Nyeri, Kenya, with a bold mission—to make premium vehicles accessible to every customer, anywhere in the world. 
          From humble beginnings to global operations, our journey reflects dedication, growth, and a passion for excellence.
        </p>
        
        <h3 className="text-2xl font-bold mb-6 text-center">🕰 Our Milestones</h3>
        <div className="grid md:grid-cols-5 gap-6">
          {[
            { year: "2015", event: "Founded in Nairobi – Karen" },
            { year: "2021", event: "First cross-border sale to Westlands International Client" },
            { year: "2022", event: "Expanded sourcing and exports to Japan" },
            { year: "2024", event: "Surpassed 10,000 vehicles sold globally" },
            { year: String(sale.year), event: `🎉 ${sale.short} - Up to 90% Asset Financing!` },
          ].map((milestone) => (
            <div key={milestone.year} className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{milestone.year}</div>
              <p className="text-sm text-muted-foreground">{milestone.event}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="space-y-12">
        <h2 className="text-4xl font-bold text-center">👥 Meet Our Leadership & Global Team</h2>
        
        {/* Team Flip Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* CEO Card */}
          <div className="relative h-80 perspective-1000">
            <div 
              className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                flippedCards['ceo'] ? 'rotate-y-180' : ''
              }`}
              onClick={() => toggleCard('ceo')}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center">
                <img
                  src={ceoImage}
                  alt="Justice Vincent - CEO"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4"
                />
                <h3 className="text-xl font-bold mb-2">Justice Vincent</h3>
                <p className="text-sm text-primary font-semibold mb-2">Chief Executive Officer (CEO)</p>
                <p className="text-xs text-muted-foreground">📍 Kenya / Global Operations</p>
                <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-3">Justice Vincent</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Justice Vincent leads Justice Ultimate Automobiles with a passion for excellence, integrity, and world-class customer service. 
                    With years of experience in global automotive sourcing, he has transformed the company into a trusted international brand.
                  </p>
                  <p className="text-xs italic text-muted-foreground mb-4">
                    "Committed to delivering vehicles across continents—safely and professionally."
                  </p>
                </div>
                <div className="space-y-2">
                  <a 
                    href="https://wa.me/254722827458" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞 WhatsApp: 0722 827 458
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* System Admin Card */}
          <div className="relative h-80 perspective-1000">
            <div 
              className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                flippedCards['admin'] ? 'rotate-y-180' : ''
              }`}
              onClick={() => toggleCard('admin')}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center">
                <img
                  src={danielImage}
                  alt="Daniel Maina W. - System Administrator"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary mb-4"
                />
                <h3 className="text-xl font-bold mb-2">Daniel Maina W.</h3>
                <p className="text-sm text-primary font-semibold mb-2">System Administrator & DevOps Engineer</p>
                <p className="text-xs text-muted-foreground">📍 Kenya</p>
                <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-3">Daniel Maina W.</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Software DevOps Engineer, Cybersecurity Specialist, Programmer, and Graphics Designer with over 2 years of professional experience.
                  </p>
                  <div className="text-xs text-muted-foreground mb-4">
                    <p className="mb-1">🛡 Responsibilities:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>System Security</li>
                      <li>AI Integrations</li>
                      <li>Web & App Development</li>
                      <li>Technical Support</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <a 
                    href="https://wa.me/254701460110" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞 WhatsApp: 0701 460 110
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Head of Exports Card */}
          <div className="relative h-80 perspective-1000">
            <div 
              className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                flippedCards['exports'] ? 'rotate-y-180' : ''
              }`}
              onClick={() => toggleCard('exports')}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-primary mb-4 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Name Hidden</h3>
                <p className="text-sm text-primary font-semibold mb-2">Head of Exports – Japan Division</p>
                <p className="text-xs text-muted-foreground">📍 Japan</p>
                <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-center">
                <div>
                  <h3 className="text-lg font-bold mb-3">Head of Exports</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Oversees sourcing, inspection, and vehicle verification across Japan's largest auction networks. 
                    Ensures clients receive the best quality vehicles at competitive prices.
                  </p>
                  <p className="text-xs text-primary font-semibold">📍 Japan Division</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Lead Card */}
          <div className="relative h-80 perspective-1000">
            <div 
              className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                flippedCards['logistics'] ? 'rotate-y-180' : ''
              }`}
              onClick={() => toggleCard('logistics')}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-primary mb-4 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Name Hidden</h3>
                <p className="text-sm text-primary font-semibold mb-2">Global Logistics Lead</p>
                <p className="text-xs text-muted-foreground">📍 Global</p>
                <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-center">
                <div>
                  <h3 className="text-lg font-bold mb-3">Logistics Lead</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coordinates international shipping, port operations, customs procedures, and delivery timelines 
                    to ensure smooth end-to-end logistics for all exported vehicles.
                  </p>
                  <p className="text-xs text-primary font-semibold">📍 Global Operations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Rep Card */}
          <div className="relative h-80 perspective-1000">
            <div 
              className={`relative w-full h-full duration-700 transform-style-preserve-3d cursor-pointer ${
                flippedCards['sales'] ? 'rotate-y-180' : ''
              }`}
              onClick={() => toggleCard('sales')}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden glass-strong rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-primary mb-4 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Name Hidden 🇰🇪</h3>
                <p className="text-sm text-primary font-semibold mb-2">Regional Sales Representative</p>
                <p className="text-xs text-muted-foreground">📍 Kenya</p>
                <div className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass-strong rounded-2xl p-6 flex flex-col justify-center">
                <div>
                  <h3 className="text-lg font-bold mb-3">Sales Representative</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports customers across Kenya with vehicle sales, showroom assistance, documentation, 
                    and comprehensive after-sales services.
                  </p>
                  <p className="text-xs text-primary font-semibold">📍 Kenya Region</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">🛡️ Why Thousands Trust Us</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're committed to transparency, security, and delivering exceptional service. Here's what sets us apart.
          </p>
        </div>

        {/* Trust Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-strong rounded-xl p-6 text-center space-y-3">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold">100% Verified Car History</h3>
            <p className="text-sm text-muted-foreground">
              Every vehicle undergoes thorough inspection and comes with complete documentation
            </p>
          </div>

          <div className="glass-strong rounded-xl p-6 text-center space-y-3">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-lg font-bold">Transparent Pricing</h3>
            <p className="text-sm text-muted-foreground">
              No hidden fees. What you see is what you pay, with flexible payment options
            </p>
          </div>

          <div className="glass-strong rounded-xl p-6 text-center space-y-3">
            <div className="text-4xl mb-2">🔒</div>
            <h3 className="text-lg font-bold">Secure Payment Options</h3>
            <p className="text-sm text-muted-foreground">
              Bank transfers, mobile money, and secure online payments with 2FA protection
            </p>
          </div>

          <div className="glass-strong rounded-xl p-6 text-center space-y-3">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-bold">Physical Inspections</h3>
            <p className="text-sm text-muted-foreground">
              Visit our showroom anytime. See, test, and verify before you buy
            </p>
          </div>
        </div>

        {/* Company Credentials */}
        <div className="glass-strong rounded-3xl p-12">
          <h3 className="text-3xl font-bold mb-8 text-center">📋 Company Credentials</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl mb-2">🏢</div>
              <h4 className="font-bold">Certificate of Incorporation</h4>
              <p className="text-sm text-muted-foreground">Registered & Licensed Business</p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl mb-2">📄</div>
              <h4 className="font-bold">Business Permit</h4>
              <p className="text-sm text-muted-foreground">County Government Approved</p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl mb-2">💼</div>
              <h4 className="font-bold">KRA Compliance</h4>
              <p className="text-sm text-muted-foreground">Tax Compliant & PIN Verified</p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl mb-2">🚗</div>
              <h4 className="font-bold">NTSA Dealer License</h4>
              <p className="text-sm text-muted-foreground">Authorized Motor Vehicle Dealer</p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl mb-2">📍</div>
              <h4 className="font-bold">Physical Office</h4>
              <p className="text-sm text-muted-foreground">Mpesi Lane 11, Westlands</p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl mb-2">🌍</div>
              <h4 className="font-bold">Export Certified</h4>
              <p className="text-sm text-muted-foreground">International Trade License</p>
            </div>
          </div>
        </div>

        {/* Contact Verification */}
        <div className="glass-strong rounded-3xl p-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">📍</div>
              <h4 className="font-bold mb-2">Visit Our Showroom</h4>
              <p className="text-sm text-muted-foreground">
                Mpesi Lane 11, Westlands<br />
                Nairobi, Kenya
              </p>
              <a 
                href="https://maps.google.com/?q=Mpesi+Lane+11+Westlands+Nairobi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                View on Google Maps
              </a>
            </div>

            <div>
              <div className="text-3xl mb-2">📞</div>
              <h4 className="font-bold mb-2">24/7 Customer Support</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Call us anytime for inquiries
              </p>
              <a 
                href="tel:+254722827458" 
                className="text-primary font-semibold hover:underline"
              >
                +254 722 827 458
              </a>
            </div>

            <div>
              <div className="text-3xl mb-2">💬</div>
              <h4 className="font-bold mb-2">WhatsApp Direct</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Chat with our team instantly
              </p>
              <a 
                href="https://wa.me/254722827458" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold mb-6">🚀 Ready to Drive With Us?</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/contact">
            <Button size="lg">Contact Our Global Sales Team</Button>
          </Link>
          <Link to="/catalogue">
            <Button size="lg" variant="outline">View International Stock</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
