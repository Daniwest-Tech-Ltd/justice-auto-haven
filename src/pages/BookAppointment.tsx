import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, MapPin, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const BookAppointment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Appointment Scheduled",
        description: "Your executive consultation has been reserved. A confirmation dispatch will follow.",
      });
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <Header />
      <main className="pt-20">
        <section className="bg-slate-900 text-white py-24 relative overflow-hidden text-center">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-4">
              Schedule <span className="text-brand-red">Consultation.</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto uppercase tracking-widest font-bold">
              Reserve your priority slot for yard visits, asset financing audits, or technical walkthroughs.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-12 items-start">
              {/* Form Section */}
              <div className="md:col-span-3">
                <Card className="border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white p-8">
                    <CardTitle className="text-xl font-black uppercase tracking-widest">Appointment Registry</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="JOHN DOE" className="pl-10 h-12 bg-slate-50 border-slate-200" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="07XX XXX XXX" className="pl-10 h-12 bg-slate-50 border-slate-200" required />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consultation Type</Label>
                        <Select required>
                          <SelectTrigger className="h-12 bg-slate-50 border-slate-200 font-bold text-[10px] uppercase">
                            <SelectValue placeholder="SELECT SERVICE SECTOR" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewing">Asset Viewing / Yard Visit</SelectItem>
                            <SelectItem value="finance">Asset Financing Audit</SelectItem>
                            <SelectItem value="trade-in">Trade-In Physical Valuation</SelectItem>
                            <SelectItem value="corporate">Executive Corporate Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Date</Label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input type="date" className="pl-10 h-12 bg-slate-50 border-slate-200" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preferred Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input type="time" className="pl-10 h-12 bg-slate-50 border-slate-200" required />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={loading} className="w-full h-16 bg-brand-red hover:bg-brand-red/90 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-xl shadow-xl">
                        {loading ? "INITIALIZING..." : "Confirm Appointment"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Info Section */}
              <div className="md:col-span-2 space-y-8">
                <Card className="bg-slate-900 text-white border-none p-8 rounded-3xl space-y-6">
                  <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-brand-red" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest leading-tight">Priority Access Protocol</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                    Scheduled appointments receive priority facility access and a dedicated account executive for a seamless technical walkthrough.
                  </p>
                </Card>

                <div className="space-y-4 px-4">
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-brand-red" />
                    <p className="text-[10px] font-black uppercase text-slate-500">Muthithi Road, Westlands Hub</p>
                  </div>
                  <div className="flex gap-4">
                    <Phone className="h-5 w-5 text-brand-red" />
                    <p className="text-[10px] font-black uppercase text-slate-500">+254 722 827 458</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BookAppointment;
