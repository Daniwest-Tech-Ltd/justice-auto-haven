import { ShieldCheck, Globe, Trophy, Shield, Users, History, Target, Eye, Award, CheckCircle, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Hero Header */}
      <section className="relative py-24 bg-slate-900 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="/home im.png" alt="Justice Ultimate Office" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
            <p className="text-[11px] font-black tracking-[0.4em] uppercase text-brand-red">Our Profile</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
              The <span className="text-brand-red">Ultimate</span> Story.
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed uppercase tracking-widest pt-4">
              Kenya's leading car dealer. We specialize in high quality Japanese imports and help businesses and individuals get the best cars with easy financing.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto space-y-24">

          {/* History Section */}
          <section className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-brand-red/10 text-brand-red font-black text-[10px] uppercase tracking-widest">
                <History className="h-3.5 w-3.5" /> Established 2020
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-foreground italic">Legacy of <span className="text-brand-red">Precision.</span></h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-loose font-medium">
                <p>
                  Founded in 2020 by Justice Vincent, Justice Ultimate Automobiles emerged from a vision to revolutionize the Kenyan automotive marketplace. What started as a focused brokerage has evolved into an institutional-grade terminal for high-performance Japanese and European imports.
                </p>
                <p>
                  Our journey began with a single mission: to provide the highest level of transparency in a market often clouded by uncertainty. By implementing rigorous multi-stage audit protocols and direct logistics coordination from Japan, we eliminated the middle-man inefficiencies that previously burdened Kenyan car buyers.
                </p>
                <p>
                  Today, Justice Ultimate Automobiles stands as a pillar of reliability in Westlands, Nairobi. We don't just sell cars; we manage high-value automotive assets for discerning individuals and corporate entities across East Africa.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-red/5 rounded-3xl blur-2xl" />
              <img src="/catalogue.png" alt="Showroom" className="relative rounded-2xl border border-border shadow-2xl z-10" />
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="grid md:grid-cols-3 gap-8">
            <div className="bg-secondary/10 p-10 rounded-2xl border border-border space-y-6 group hover:border-brand-red/30 transition-all duration-500">
               <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:bg-brand-red transition-all">
                  <Target className="h-7 w-7" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight">Our Mission</h3>
               <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-wider">
                 To provide easy car buying through high quality imports, ensuring every car delivered meets the highest safety and performance standards.
               </p>
            </div>
            <div className="bg-secondary/10 p-10 rounded-2xl border border-border space-y-6 group hover:border-brand-red/30 transition-all duration-500">
               <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:bg-brand-red transition-all">
                  <Eye className="h-7 w-7" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight">Our Vision</h3>
               <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-wider">
                 To be the most trusted place for car buying in Kenya, helping people grow through reliable cars and easy loans.
               </p>
            </div>
            <div className="bg-secondary/10 p-10 rounded-2xl border border-border space-y-6 group hover:border-brand-red/30 transition-all duration-500">
               <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:bg-brand-red transition-all">
                  <Trophy className="h-7 w-7" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight">Our Values</h3>
               <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-wider">
                 Honesty, quality, and always putting our customers first. We work hard to make sure you get the best car for your money.
               </p>
            </div>
          </section>

          {/* Deep Content - Company Story Continued */}
          <section className="space-y-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tight text-center italic">Why Institutional <span className="text-brand-red">Trust Matters.</span></h2>
              <div className="h-1.5 w-24 bg-brand-red mx-auto rounded-full" />
            </div>

            <div className="space-y-8 text-sm text-muted-foreground leading-loose font-medium text-justify">
              <p>
                In the modern automotive landscape, the difference between a "used car" and a "verified asset" lies in the audit trail. At Justice Ultimate Automobiles, we treat every vehicle in our inventory as a critical piece of technical equipment. Our procurement team in Japan doesn't just look for cars that look good; they look for units with documented service histories, structural integrity, and verified mileage.
              </p>
              <p>
                Our 2026 expansion strategy focus on digital-first terminal management. By integrating blockchain-ready record keeping and real-time inventory tracking, we allow our clients to see the status of their procurement at every stage of the logistics cycle. From the auction floor in Tokyo to the dispatch yard in Mombasa, your asset is tracked with institutional precision.
              </p>
              <p>
                The Justice Ultimate brand is built on three core pillars: **Procurement Excellence**, **Financial Accessibility**, and **Operational Reliability**. We understand that buying a car is often the second largest investment a person makes. That's why we've partnered with Tier-1 financial institutions to offer up to 90% asset financing, making high-quality mobility accessible to more Kenyans.
              </p>
              <p>
                Our Westlands hub serves as more than just a showroom. It is a consultation center where fleet managers, corporate entities, and private collectors meet to discuss their mobility needs. Whether you are scaling a 50-unit logistics fleet or acquiring a single luxury SUV, you receive the same level of executive attention and technical audit reporting.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-12 border-y border-border">
               {[
                 { val: "5,000+", label: "Units Delivered" },
                 { val: "98%", label: "Audit Success" },
                 { val: "6+", label: "Regional Hubs" },
                 { val: "24/7", label: "Global Dispatch" }
               ].map((stat, i) => (
                 <div key={i} className="text-center space-y-1">
                    <p className="text-3xl font-black text-brand-red tracking-tighter">{stat.val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                 </div>
               ))}
            </div>

            <div className="space-y-8 text-sm text-muted-foreground leading-loose font-medium text-justify">
               <p>
                 As we look toward the future, Justice Ultimate Automobiles is investing heavily in the electric vehicle (EV) infrastructure within East Africa. We are not just followers of trends; we are architects of the region's automotive future. Our technical support hub is already training specialists in hybrid and battery electric vehicle maintenance to ensure that as the world shifts, our clients remain at the forefront of automotive technology.
               </p>
               <p>
                 We invite you to experience the Ultimate difference. Browse our high-density digital ledger, speak to our technical consultants, and discover why we are Africa's premier automotive terminal. Your trust is our most valuable asset, and we protect it through a relentless commitment to precision, transparency, and results.
               </p>
            </div>
          </section>

          {/* Strategic Roadmap - 2026 and Beyond */}
          <section className="space-y-12">
             <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight italic text-slate-900">Our Future <br/> <span className="text-brand-red">Plans.</span></h2>
                <div className="h-1.5 w-24 bg-brand-red mx-auto rounded-full" />
             </div>

             <div className="grid md:grid-cols-2 gap-16 text-sm text-muted-foreground leading-loose font-medium text-justify">
                <div className="space-y-6">
                   <h4 className="text-lg font-black uppercase text-slate-900 flex items-center gap-3">
                      <div className="h-6 w-1 bg-brand-red" />
                      Easy Online Buying
                   </h4>
                   <p>
                      In 2026, we are making it even easier to buy cars online. We are building a new system where you can tell us exactly what you want—like engine size, safety, and price—and our system will find the perfect car for you in Japan or Europe. This means you get the best deal without any stress.
                   </p>
                   <p>
                      We are also working on ways to let you see our cars from anywhere. Soon, you can take a virtual tour of any car in our Westlands yard using your phone or computer, so you don't have to travel all the way to Nairobi to see your dream car.
                   </p>
                </div>
                <div className="space-y-6">
                   <h4 className="text-lg font-black uppercase text-slate-900 flex items-center gap-3">
                      <div className="h-6 w-1 bg-brand-red" />
                      Electric and Hybrid Cars
                   </h4>
                   <p>
                      We are leading the way by bringing more electric and hybrid cars to Kenya. These cars help protect the environment and save you a lot of money on fuel. We are setting up charging stations and helping our customers install chargers at their homes and offices.
                   </p>
                   <p>
                      Our team is also learning how to take care of these new types of cars. We want to make sure that as the world changes, we are ready to give you the best support for your electric or hybrid car for many years to come.
                   </p>
                </div>
             </div>
          </section>

          {/* Corporate Responsibility - Giving Back */}
          <section className="bg-slate-50 p-12 md:p-16 rounded-[40px] border border-slate-200 space-y-12">
             <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red">Giving Back</p>
                   <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Our Community <br/> <span className="text-brand-red">Work.</span></h2>
                </div>
                <div className="flex gap-4">
                   <div className="h-12 w-12 rounded-full border border-slate-300 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-brand-red" /></div>
                   <div className="h-12 w-12 rounded-full border border-slate-300 flex items-center justify-center"><Globe className="h-6 w-6 text-brand-red" /></div>
                </div>
             </div>

             <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8 text-sm text-muted-foreground leading-loose font-medium text-justify uppercase tracking-wide">
                   <p>
                      At Justice Ultimate Automobiles, we believe in helping our community. We focus on two main areas: **Teaching Technical Skills** and **Road Safety**.
                   </p>
                   <p>
                      Through our training program, we help young mechanics learn how to use modern tools for Japanese and European cars. This helps them get better jobs and builds a stronger future for the car industry in Kenya.
                   </p>
                   <p>
                      We also care about safety on our roads. We use some of our profits to teach our customers how to drive safely and to show people how important it is to check their cars regularly. We believe that safer roads make life better for everyone.
                   </p>
                </div>
                <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Our Main Projects</h4>
                   <ul className="space-y-4">
                      <li className="flex gap-3 items-start">
                         <div className="h-1.5 w-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                         <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed text-slate-500">Mechanic Training: Helping 50+ students every year.</p>
                      </li>
                      <li className="flex gap-3 items-start">
                         <div className="h-1.5 w-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                         <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed text-slate-500">Safe Driving: Free workshops for our customers.</p>
                      </li>
                      <li className="flex gap-3 items-start">
                         <div className="h-1.5 w-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                         <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed text-slate-500">Eco-Friendly: Supporting electric car charging stations.</p>
                      </li>
                   </ul>
                </div>
             </div>
          </section>

          {/* Institutional Team */}
          <section className="space-y-12">
             <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight italic">Executive <span className="text-brand-red">Leadership.</span></h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">The architects of the 2026 terminal vision</p>
             </div>

             <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-slate-900 p-8 rounded-2xl border border-white/5 space-y-6 text-center">
                   <div className="h-32 w-32 rounded-full bg-brand-red/20 mx-auto border-2 border-brand-red/50 flex items-center justify-center shadow-2xl shadow-brand-red/20">
                      <Users className="h-12 w-12 text-brand-red" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-xl font-black uppercase text-white">Justice Vincent</h4>
                      <p className="text-xs font-black uppercase tracking-widest text-brand-red italic">Founder & CEO</p>
                   </div>
                   <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                      Directing the institutional growth and strategic procurement protocols of the Ultimate brand.
                   </p>
                </div>
                <div className="bg-slate-900 p-8 rounded-2xl border border-white/5 space-y-6 text-center">
                   <div className="h-32 w-32 rounded-full bg-blue-600/20 mx-auto border-2 border-blue-600/50 flex items-center justify-center shadow-2xl shadow-blue-600/20">
                      <Globe className="h-12 w-12 text-blue-500" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-xl font-black uppercase text-white">Institutional Support</h4>
                      <p className="text-xs font-black uppercase tracking-widest text-blue-500 italic">Operations Team</p>
                   </div>
                   <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                      Managing 24/7 global dispatch and technical audit compliance across our regional hubs.
                   </p>
                </div>
             </div>
          </section>

          {/* Contact CTA */}
          <section className="bg-brand-red p-12 md:p-20 rounded-3xl text-center space-y-8 shadow-2xl shadow-brand-red/30">
             <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">Ready to Scale Your <br/> <span className="text-slate-900">Automotive Future?</span></h2>
                <p className="text-xs md:text-sm text-white/90 font-bold uppercase tracking-widest max-w-2xl mx-auto">
                   Connect with our executive consultants today for a technical yard audit or asset procurement plan.
                </p>
             </div>
             <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={() => navigate("/contact")} size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-[0.3em] px-12 h-16 rounded-xl border-none">
                  Consult Experts
                </Button>
                <Button onClick={() => navigate("/catalogue")} size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-black text-[11px] uppercase tracking-[0.3em] px-12 h-16 rounded-xl backdrop-blur-md">
                  Browse Inventory
                </Button>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default About;
