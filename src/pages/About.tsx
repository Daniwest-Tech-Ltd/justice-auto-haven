import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ceoImage from "@/assets/ceo.jpg";

const About = () => {
  return (
    <div className="container mx-auto px-4 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Driving Excellence <span className="bg-gradient-accent bg-clip-text text-transparent">Beyond Borders</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connecting Kenya to the world, one car at a time. From Nairobi to New York, we deliver unmatched value in vehicle sourcing, export, import, and sales.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/services">
              <Button size="lg">Explore Our Global Services</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">Visit Showroom</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            Our mission is to redefine trust in vehicle acquisition by connecting global customers with high-quality, affordable cars from Kenya and across the world.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
          <p className="text-muted-foreground">
            To be Africa's most trusted and internationally recognized automobile dealer, delivering cars across continents with precision, professionalism, and pride.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="glass-strong rounded-3xl p-12">
        <h2 className="text-4xl font-bold mb-8 text-center">💎 Core Values</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { icon: "🌐", title: "Global Reach" },
            { icon: "🤝", title: "Integrity" },
            { icon: "🚗", title: "Quality Assurance" },
            { icon: "📦", title: "Seamless Logistics" },
            { icon: "🌟", title: "Customer Success" },
            { icon: "⚙️", title: "Innovation & Tech" },
          ].map((value) => (
            <div key={value.title} className="text-center">
              <div className="text-4xl mb-2">{value.icon}</div>
              <p className="text-sm font-medium">{value.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="glass-strong rounded-3xl p-12">
        <h2 className="text-4xl font-bold mb-8 text-center">📖 Our Story</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12 text-center">
          Justice Ultimate Automobiles began in Nyeri, Kenya, with a bold vision — to give every customer, no matter their location, access to world-class vehicles. From humble beginnings to global exports, we've built a company driven by passion, purpose, and people.
        </p>
        <div className="grid md:grid-cols-5 gap-6">
          {[
            { year: "2020", event: "Founded in Nyeri" },
            { year: "2021", event: "First cross-border sale to Uganda" },
            { year: "2022", event: "Europe export expansion" },
            { year: "2023", event: "Over 1,000 cars sold" },
            { year: "2024", event: "Global logistics hub opened in Mombasa" },
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
        <h2 className="text-4xl font-bold text-center">Meet the Team</h2>
        
        <div className="glass-strong rounded-3xl p-12 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={ceoImage}
              alt="Justice Vincent - CEO"
              className="w-48 h-48 rounded-full object-cover border-4 border-primary"
            />
            <div className="flex-1">
              <div className="text-sm text-primary font-semibold mb-2">C.E.O</div>
              <h3 className="text-3xl font-bold mb-4">Justice Vincent</h3>
              <p className="text-lg mb-4">Chief Executive Officer (C.E.O)</p>
              <p className="text-muted-foreground">
                Justice Ultimate Automobiles was built from a relentless drive to deliver world-class vehicles with honesty, excellence, and a customer-first culture. We are proud to serve clients across continents, one successful handover at a time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Daniel Maina W.", role: "System Administrator 🇰🇪" },
            { name: "******", role: "Head of Exports 🇺🇸" },
            { name: "******", role: "Logistics Lead 🇦🇪" },
            { name: "******", role: "Sales Rep 🇰🇪" },
          ].map((member) => (
            <div key={member.name} className="glass-strong rounded-2xl p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h4 className="font-bold mb-2">{member.name}</h4>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass-strong rounded-3xl p-12 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Drive With Us?</h2>
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
