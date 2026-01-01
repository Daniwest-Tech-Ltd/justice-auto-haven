import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Upload, CheckCircle, Clock, Shield, 
  Building2, User, Car, DollarSign, Calendar, Phone, Mail, MapPin,
  Briefcase, CreditCard, AlertCircle, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});
  const [selectedCar, setSelectedCar] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      id_number: "",
      kra_pin: "",
      employment_type: "salaried",
      repayment_period: "36",
      consent: false,
    },
  });

  const employmentType = form.watch("employment_type");

  // Fetch selected car if carId is provided
  useEffect(() => {
    const carId = searchParams.get("car");
    if (carId) {
      fetchCarDetails(carId);
    }
    
    // Pre-fill user data if logged in
    fetchUserProfile();
  }, [searchParams]);

  const fetchCarDetails = async (carId: string) => {
    const { data: car } = await supabase
      .from("cars")
      .select("*")
      .eq("id", carId)
      .single();
    
    if (car) {
      setSelectedCar(car);
      form.setValue("vehicle_name", `${car.year} ${car.make} ${car.model}`);
      form.setValue("vehicle_price", car.price?.toString() || "");
      // Calculate 10% minimum deposit
      const minDeposit = Math.ceil(car.price * 0.1);
      form.setValue("deposit_amount", minDeposit.toString());
      // Calculate finance amount
      const financeAmount = car.price - minDeposit;
      form.setValue("finance_amount", financeAmount.toString());
    }
  };

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profile) {
        form.setValue("full_name", profile.full_name || "");
        form.setValue("phone", profile.phone || "");
        form.setValue("email", profile.email || "");
      }
    }
  };

  const handleFileChange = (docType: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [docType]: file }));
  };

  const uploadDocument = async (applicationId: string, docType: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationId}/${docType}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("finance-documents")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    await supabase.from("application_documents").insert({
      application_id: applicationId,
      document_type: docType,
      file_path: fileName,
      file_name: file.name,
      file_size: file.size,
    });
  };

  const onSubmit = async (values: FormValues) => {
    // Validate required documents
    const requiredDocs = ["national_id", "kra_pin", "bank_statements"];
    if (employmentType === "salaried") {
      requiredDocs.push("payslips");
    }
    
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    if (missingDocs.length > 0) {
      toast({
        title: "Missing Documents",
        description: `Please upload: ${missingDocs.join(", ").replace(/_/g, " ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create application
      const { data: application, error: appError } = await supabase
        .from("asset_finance_applications")
        .insert({
          user_id: user?.id || null,
          full_name: values.full_name,
          phone: values.phone,
          email: values.email,
          id_number: values.id_number,
          kra_pin: values.kra_pin,
          date_of_birth: values.date_of_birth || null,
          county_town: values.county_town || null,
          employment_type: values.employment_type,
          employer_or_business: values.employer_or_business || null,
          job_title: values.job_title || null,
          monthly_income: values.monthly_income ? parseFloat(values.monthly_income) : null,
          employment_duration: values.employment_duration || null,
          business_type: values.business_type || null,
          years_in_operation: values.years_in_operation ? parseInt(values.years_in_operation) : null,
          vehicle_name: values.vehicle_name || null,
          vehicle_id: selectedCar?.id || null,
          vehicle_price: values.vehicle_price ? parseFloat(values.vehicle_price) : null,
          deposit_amount: values.deposit_amount ? parseFloat(values.deposit_amount) : 0,
          finance_amount: values.finance_amount ? parseFloat(values.finance_amount) : null,
          repayment_period: parseInt(values.repayment_period),
          status: "pending",
        })
        .select()
        .single();

      if (appError) throw appError;

      // Upload all documents
      for (const [docType, file] of Object.entries(documents)) {
        if (file) {
          setUploadProgress(prev => ({ ...prev, [docType]: true }));
          await uploadDocument(application.id, docType, file);
          setUploadProgress(prev => ({ ...prev, [docType]: false }));
        }
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-finance-email", {
          body: {
            applicationId: application.id,
            status: "pending",
            recipientEmail: values.email,
            recipientName: values.full_name,
            vehicleName: values.vehicle_name,
            financeAmount: values.finance_amount ? parseFloat(values.finance_amount) : null,
          },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }

      toast({
        title: "Application Submitted Successfully! 🎉",
        description: "We will review your application and respond within 3 business days. Check your email for confirmation.",
      });

      navigate("/order-status");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Banner */}
      <section className="relative py-16 bg-gradient-to-r from-primary via-primary/90 to-amber-600 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 text-lg px-4 py-2">
            🎉 New Year Mega Sale 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Apply for Asset Finance
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Fast approvals • Secure process • Response within 3 days
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Shield className="h-5 w-5" />
              <span>Up to 90% Financing</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Clock className="h-5 w-5" />
              <span>3-Day Approval</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <CheckCircle className="h-5 w-5" />
              <span>Trusted Partners</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Personal Details
                    </CardTitle>
                    <CardDescription>
                      Enter your personal information as per your National ID
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="0751 555 544" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="id_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National ID Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter ID number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="kra_pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KRA PIN *</FormLabel>
                          <FormControl>
                            <Input placeholder="A123456789K" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="county_town"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>County / Town</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Nairobi, Westlands" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Employment / Business Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Employment / Business Details
                    </CardTitle>
                    <CardDescription>
                      Select your employment type and provide relevant details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="employment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="salaried">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Salaried Individual (Up to 90% Financing)
                                </div>
                              </SelectItem>
                              <SelectItem value="business">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  Business Owner (Up to 80% Financing)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      {employmentType === "salaried" ? (
                        <>
                          <FormField
                            control={form.control}
                            name="employer_or_business"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employer Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Company name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="job_title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your position" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="monthly_income"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Net Salary (KES)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., 150,000" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ""))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="employment_duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employment Duration</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2 years" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name="employer_or_business"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your business name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="business_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Type</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Retail, Services" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="monthly_income"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Turnover (KES)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., 500,000" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ""))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="years_in_operation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years in Operation</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="e.g., 3" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      Vehicle Details
                    </CardTitle>
                    <CardDescription>
                      {selectedCar 
                        ? "Vehicle pre-selected from catalogue" 
                        : "Enter the vehicle you wish to finance"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vehicle_name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Car Make & Model</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2024 Toyota Land Cruiser" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicle_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Price (KES)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 5,000,000" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "");
                                field.onChange(value);
                                // Auto-calculate deposit and finance amount
                                const price = parseFloat(value);
                                if (!isNaN(price)) {
                                  const deposit = Math.ceil(price * 0.1);
                                  form.setValue("deposit_amount", deposit.toString());
                                  form.setValue("finance_amount", (price - deposit).toString());
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deposit_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Amount (KES)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Minimum 10%" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "");
                                field.onChange(value);
                                const price = parseFloat(form.getValues("vehicle_price") || "0");
                                const deposit = parseFloat(value);
                                if (!isNaN(price) && !isNaN(deposit)) {
                                  form.setValue("finance_amount", (price - deposit).toString());
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="finance_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Finance Amount Needed (KES)</FormLabel>
                          <FormControl>
                            <Input placeholder="Auto-calculated" {...field} readOnly className="bg-muted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="repayment_period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repayment Period</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12">12 Months (1 Year)</SelectItem>
                              <SelectItem value="24">24 Months (2 Years)</SelectItem>
                              <SelectItem value="36">36 Months (3 Years)</SelectItem>
                              <SelectItem value="48">48 Months (4 Years)</SelectItem>
                              <SelectItem value="60">60 Months (5 Years)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Document Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Document Upload
                    </CardTitle>
                    <CardDescription>
                      Upload clear copies of the required documents (PDF, JPG, PNG)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* National ID */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          National ID Copy *
                          {documents.national_id && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </label>
                        <div className="relative">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange("national_id", e.target.files?.[0] || null)}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                        </div>
                        {documents.national_id && (
                          <p className="text-xs text-muted-foreground">{documents.national_id.name}</p>
                        )}
                      </div>

                      {/* KRA PIN */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          KRA PIN Certificate *
                          {documents.kra_pin && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange("kra_pin", e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {documents.kra_pin && (
                          <p className="text-xs text-muted-foreground">{documents.kra_pin.name}</p>
                        )}
                      </div>

                      {/* Bank Statements */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          Bank Statements ({employmentType === "salaried" ? "6 months" : "1 year"}) *
                          {documents.bank_statements && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange("bank_statements", e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {documents.bank_statements && (
                          <p className="text-xs text-muted-foreground">{documents.bank_statements.name}</p>
                        )}
                      </div>

                      {/* Payslips / M-Pesa */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {employmentType === "salaried" ? "Payslips (3 current) *" : "M-Pesa Statements (1 year)"}
                          {documents.payslips && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange("payslips", e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {documents.payslips && (
                          <p className="text-xs text-muted-foreground">{documents.payslips.name}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consent */}
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="consent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I authorize Justice Ultimate Automobiles to verify my information with relevant 
                              financial institutions and credit bureaus for the purpose of this application.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Submit Asset Finance Application
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Sidebar - Requirements & Info */}
          <div className="space-y-6">
            {/* Selected Vehicle Card */}
            {selectedCar && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Selected Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden mb-3">
                    <img 
                      src={Array.isArray(selectedCar.images) ? selectedCar.images[0] : "/placeholder.svg"}
                      alt={selectedCar.model}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold">{selectedCar.year} {selectedCar.make} {selectedCar.model}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    KES {selectedCar.price?.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Requirements Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Requirements 2026
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Salaried (Up to 90%)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ 6 months bank statements</li>
                    <li>✓ 3 current payslips</li>
                    <li>✓ KRA PIN copy</li>
                    <li>✓ National ID copy</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Business (Up to 80%)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ 1 year bank statements</li>
                    <li>✓ 1 year M-Pesa statements</li>
                    <li>✓ KRA PIN copy</li>
                    <li>✓ National ID copy</li>
                  </ul>
                </div>
                <Separator />
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Processing: Maximum 3 Days
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why Choose Us?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Secure & Confidential</p>
                    <p className="text-xs text-muted-foreground">Your data is encrypted and protected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Trusted Finance Partners</p>
                    <p className="text-xs text-muted-foreground">Banks & SACCOs across Kenya</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Competitive Rates</p>
                    <p className="text-xs text-muted-foreground">Best interest rates in the market</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-amber-500/10">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Need Help?</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href="tel:0751555544" className="hover:underline">0751 555 544</a>
                  </p>
                  <div className="space-y-1.5 mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Departments:</p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href="mailto:info@justiceultimateautomobiles.com" className="hover:underline text-xs">info@justiceultimateautomobiles.com</a>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <a href="mailto:support@justiceultimateautomobiles.com" className="hover:underline text-xs">support@justiceultimateautomobiles.com</a>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-500" />
                      <a href="mailto:sales@justiceultimateautomobiles.com" className="hover:underline text-xs">sales@justiceultimateautomobiles.com</a>
                    </p>
                  </div>
                  <p className="flex items-center gap-2 mt-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    Westlands, Muthithi Road, Nairobi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetFinanceApplication;
