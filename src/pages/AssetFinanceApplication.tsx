import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, CheckCircle, Clock, Shield,
  Building2, User, Car, DollarSign, Phone, Mail, MapPin,
  Briefcase, CreditCard, Loader2, ShieldCheck, Globe, Navigation, Headphones, Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentSale } from "@/lib/currentSale";
import HeroSlider from "@/components/HeroSlider";

const formSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  id_number: z.string().min(6, "Enter a valid ID number"),
  kra_pin: z.string().min(9, "Enter a valid KRA PIN"),
  date_of_birth: z.string().optional(),
  county_town: z.string().optional(),
  employment_type: z.enum(["salaried", "business"]),
  employer_or_business: z.string().optional(),
  job_title: z.string().optional(),
  monthly_income: z.string().optional(),
  employment_duration: z.string().optional(),
  business_type: z.string().optional(),
  years_in_operation: z.string().optional(),
  vehicle_name: z.string().optional(),
  vehicle_price: z.string().optional(),
  deposit_amount: z.string().optional(),
  finance_amount: z.string().optional(),
  repayment_period: z.string().default("36"),
  consent: z.boolean().refine(val => val === true, "You must consent to proceed"),
});

type FormValues = z.infer<typeof formSchema>;

const AssetFinanceApplication = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    national_id: null,
    kra_pin: null,
    bank_statements: null,
    payslips: null,
  });
  const [selectedCar, setSelectedCar] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", phone: "", email: "", id_number: "", kra_pin: "",
      employment_type: "salaried", repayment_period: "36", consent: false,
    },
  });

  const employmentType = form.watch("employment_type");

  useEffect(() => {
    const carId = searchParams.get("car");
    if (carId) fetchCarDetails(carId);
    fetchUserProfile();
  }, [searchParams]);

  const fetchCarDetails = async (carId: string) => {
    const { data: car } = await supabase.from("cars").select("*").eq("id", carId).single();
    if (car) {
      setSelectedCar(car);
      form.setValue("vehicle_name", `${car.year} ${car.make} ${car.model}`);
      form.setValue("vehicle_price", car.price?.toString() || "");
      const minDeposit = Math.ceil(car.price * 0.1);
      form.setValue("deposit_amount", minDeposit.toString());
      form.setValue("finance_amount", (car.price - minDeposit).toString());
    }
  };

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile) {
        form.setValue("full_name", profile.full_name || "");
        form.setValue("phone", profile.phone || "");
        form.setValue("email", profile.email || "");
      }
    }
  };

  const handleFileChange = (docType: string, file: File | null) => {
    if (!file) {
      setDocuments((prev) => ({ ...prev, [docType]: null }));
      return;
    }
    setDocuments((prev) => ({ ...prev, [docType]: file }));
  };

  const uploadDocument = async (userId: string, applicationId: string, docType: string, file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${applicationId}/${docType}_${Date.now()}.${fileExt}`;
    await supabase.storage.from("finance-documents").upload(fileName, file, { upsert: true });
    await supabase.from("application_documents").insert({
      application_id: applicationId, document_type: docType, file_path: fileName, file_name: file.name, file_size: file.size,
    });
  };

  const onSubmit = async (values: FormValues) => {
    const requiredDocs = ["national_id", "kra_pin", "bank_statements"];
    if (employmentType === "salaried") requiredDocs.push("payslips");
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    if (missingDocs.length > 0) {
      toast({ title: "Missing Documents", description: `Required: ${missingDocs.join(", ").replace(/_/g, " ")}`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: application, error: appError } = await supabase.from("asset_finance_applications").insert({
        user_id: user.id, full_name: values.full_name, phone: values.phone, email: values.email,
        id_number: values.id_number, kra_pin: values.kra_pin, date_of_birth: values.date_of_birth || null,
        county_town: values.county_town || null, employment_type: values.employment_type,
        employer_or_business: values.employer_or_business || null, job_title: values.job_title || null,
        monthly_income: values.monthly_income ? parseFloat(values.monthly_income) : null,
        employment_duration: values.employment_duration || null, business_type: values.business_type || null,
        years_in_operation: values.years_in_operation ? parseInt(values.years_in_operation) : null,
        vehicle_name: values.vehicle_name || null, vehicle_id: selectedCar?.id || null,
        vehicle_price: values.vehicle_price ? parseFloat(values.vehicle_price) : null,
        deposit_amount: values.deposit_amount ? parseFloat(values.deposit_amount) : 0,
        finance_amount: values.finance_amount ? parseFloat(values.finance_amount) : null,
        repayment_period: parseInt(values.repayment_period), status: "pending",
      }).select().single();

      if (appError) throw appError;

      for (const [docType, file] of Object.entries(documents)) {
        if (file) await uploadDocument(user.id, application.id, docType, file);
      }

      toast({ title: "Application Submitted", description: "Audit response within 72 business hours." });
      navigate("/order-status");
    } catch (error: any) {
      toast({ title: "Submission Error", description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Official Trust Bar */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30 shadow-2xl">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Banking Compliance
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Nationwide Coverage
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Trophy className="h-3 w-3 text-brand-red" />
                90% Max Funding
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Instant Audit
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-professional {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-professional {
          animation: marquee-professional 40s linear infinite;
        }
      `}</style>

      {/* Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
        <HeroSlider />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Asset Sourcing Desk: {getCurrentSale().year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Financial <span className="text-brand-red">Application.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Initiate your institutional asset financing query. We facilitate up to 90% capital coverage through our tier-1 banking partners. <br className="hidden md:block" /> Mean audit turnaround: 72 business hours.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto mb-12">
          <Card className="glass-strong border-border overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <div className="grid md:grid-cols-2 items-center">
              <div className="relative h-64 md:h-full min-h-[350px] overflow-hidden order-2 md:order-1">
                <img
                  src="/finance/financing.png"
                  alt="Institutional Asset Financing"
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-[3s] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent md:hidden" />
              </div>
              <div className="p-8 md:p-12 space-y-6 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                  <CreditCard className="h-3 w-3 animate-pulse" />
                  Tier-1 Financial Desk
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
                  Own Your Dream Unit with <span className="text-brand-red">90% Capital Backing.</span>
                </h2>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed uppercase tracking-wide">
                  Bridge the gap between ambition and ownership. Our strategic banking alliances provide high-fidelity financing solutions with optimized interest caps and ultra-fast 72-hour dispatch cycles.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xl font-black text-primary italic">90%</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Max Funding</p>
                  </div>
                  <div className="space-y-1 border-x border-border px-4">
                    <p className="text-xl font-black text-primary italic">72H</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Audit Cycle</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-primary italic">60</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Max Months</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Application Track */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Section: Identity Audit */}
                <Card className="rounded-md border-border bg-background shadow-sm">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Identity Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
                    <FormField control={form.control} name="full_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Full Legal Name</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Contact Number</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Professional Email</FormLabel>
                        <FormControl><Input type="email" className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="id_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">National ID / Passport</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="kra_pin" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">KRA PIN Certificate</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="county_town" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Operational Region</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Section: Economic Track */}
                <Card className="rounded-md border-border bg-background shadow-sm">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Economic Track
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <FormField control={form.control} name="employment_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Revenue Stream Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="h-10 rounded-sm text-xs"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="salaried" className="text-xs uppercase">Salaried Professional (90% Funding)</SelectItem>
                            <SelectItem value="business" className="text-xs uppercase">Business Entity (80% Funding)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="employer_or_business" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Organization Name</FormLabel>
                          <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="monthly_income" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Net Monthly Revenue (KES)</FormLabel>
                          <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* Section: Asset Configuration */}
                <Card className="rounded-md border-border bg-background shadow-sm">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      Asset Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4 pt-6">
                    <FormField control={form.control} name="vehicle_name" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Target Unit / Model</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="vehicle_price" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Market Valuation (KES)</FormLabel>
                        <FormControl><Input className="h-10 rounded-sm text-xs" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="repayment_period" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider">Amortization Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="h-10 rounded-sm text-xs"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="12" className="text-xs uppercase">12 Cycles</SelectItem>
                            <SelectItem value="24" className="text-xs uppercase">24 Cycles</SelectItem>
                            <SelectItem value="36" className="text-xs uppercase">36 Cycles</SelectItem>
                            <SelectItem value="48" className="text-xs uppercase">48 Cycles</SelectItem>
                            <SelectItem value="60" className="text-xs uppercase">60 Cycles</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Section: Document Validation */}
                <Card className="rounded-md border-border bg-background shadow-sm text-left">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Document Validation (PDF/JPEG)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                    {["national_id", "kra_pin", "bank_statements", "payslips"].map((doc) => (
                      <div key={doc} className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                          {doc.replace('_', ' ')}
                          {documents[doc] && <CheckCircle className="h-3 w-3 text-green-500" />}
                        </label>
                        <Input type="file" onChange={(e) => handleFileChange(doc, e.target.files?.[0] || null)} className="h-9 text-[9px] uppercase font-bold file:bg-primary file:text-white file:border-none file:rounded-sm file:px-3 file:py-1 cursor-pointer" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-md border-border bg-background shadow-sm">
                  <CardContent className="pt-6">
                    <FormField control={form.control} name="consent" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="rounded-sm" /></FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-[10px] font-medium leading-relaxed text-muted-foreground uppercase">
                            I authorize Justice Ultimate Automobiles to execute a verification audit of my financial credentials for asset acquisition purposes.
                          </FormLabel>
                        </div>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-md bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initialize Asset Audit"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Business Support Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-md border-border bg-secondary/5">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Audit Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Building2 className="h-3 w-3" /> Salaried Track</h4>
                  <ul className="text-[10px] font-bold text-muted-foreground uppercase space-y-2 leading-tight">
                    <li>• 6 Mo. Official Statements</li>
                    <li>• 3 Most Recent Payslips</li>
                    <li>• KRA PIN Certificate</li>
                    <li>• National Identity Card</li>
                  </ul>
                </div>
                <Separator className="bg-border/50" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-accent tracking-widest flex items-center gap-2"><Briefcase className="h-3 w-3" /> Business Track</h4>
                  <ul className="text-[10px] font-bold text-muted-foreground uppercase space-y-2 leading-tight">
                    <li>• 12 Mo. Corporate Statements</li>
                    <li>• 12 Mo. Transactional Ledger</li>
                    <li>• KRA PIN Certificate</li>
                    <li>• Director Identity Audit</li>
                  </ul>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-sm text-center">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em]">Max Dispatch Latency: 72 Hours</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border-border bg-background shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Compliance & Safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {[
                  { icon: Shield, title: "Data Encryption", desc: "Military-grade data handling.", color: "text-emerald-500" },
                  { icon: CheckCircle, title: "Bank Direct", desc: "No middle-man commissions.", color: "text-primary" },
                  { icon: DollarSign, title: "Market Rates", desc: "Optimized interest caps.", color: "text-accent" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <item.icon className={`h-4 w-4 ${item.color} mt-0.5`} />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-tight">{item.title}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-md border-border bg-primary text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
              <CardContent className="pt-8 pb-6 text-center space-y-4 relative z-10">
                <Headphones className="h-8 w-8 mx-auto text-brand-red opacity-80" />
                <div className="space-y-1">
                   <h3 className="text-sm font-black uppercase tracking-widest">Financial Desk</h3>
                   <p className="text-[9px] font-bold uppercase opacity-70">Direct human assistance</p>
                </div>
                <p className="text-xl font-black font-mono tracking-tighter">0751 555 544</p>
                <Button variant="outline" className="w-full bg-white/5 border-white/20 text-[10px] font-black uppercase tracking-widest h-10 rounded-sm hover:bg-white hover:text-primary transition-all" onClick={() => navigate("/contact")}>Establish Connection</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetFinanceApplication;
