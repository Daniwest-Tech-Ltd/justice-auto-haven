import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Target, Users, TrendingUp, Building2, Car, BellRing, Briefcase,
  MapPin, Phone, Mail, ChevronRight, Activity, ArrowUpRight, Flame, BarChart3, ChevronLeft
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

// Mock Data representing the AI discoveries as requested
const MOCK_HOT_LEADS = [
  {
    id: 1, name: "John Kamau", vehicle: "Toyota Prado TX", intent: 94, location: "Nairobi", budget: "KES 5.8M",
    activities: ["Viewed Prado", "Viewed price", "Finance calculator", "Financing page", "Quote request"],
    phone: "0722XXX458", email: "john.kamau@example.com", reason: "High purchase intent + financing interest.",
    financing: "Likely", status: "New"
  },
  {
    id: 2, name: "Sarah Wanjiku", vehicle: "Toyota Harrier", intent: 88, location: "Kiambu", budget: "KES 4.2M",
    activities: ["Viewed Harrier", "Viewed financing", "Requested Test Drive"],
    phone: "0711XXX890", email: "sarah.w@example.com", reason: "Test drive requested recently. Hot prospect.",
    financing: "Cash / Pre-approved", status: "Contacted"
  }
];

const MOCK_VEHICLE_DEMAND = [
  { model: "Toyota Prado", demand: 87, trend: "+31%", stock: 2, hotLeads: 11 },
  { model: "Toyota Harrier", demand: 73, trend: "+14%", stock: 1, hotLeads: 8 },
  { model: "Toyota Premio", demand: 64, trend: "-2%", stock: 5, hotLeads: 2 },
  { model: "Mazda CX-5", demand: 58, trend: "+5%", stock: 3, hotLeads: 4 },
  { model: "Subaru Forester", demand: 42, trend: "+1%", stock: 2, hotLeads: 1 },
];

const MOCK_BUSINESS_PROSPECTS = [
  {
    id: 1, name: "ABC Construction Ltd", need: "Fleet vehicles", vehicles: ["Toyota Hilux", "Toyota Land Cruiser", "Toyota Hiace"],
    location: "Nairobi", website: "abc.co.ke", contact: "info@abc.co.ke", score: 88,
    reason: "Company operates multiple field teams and recently won a major infrastructure tender. High probability of fleet expansion."
  },
  {
    id: 2, name: "Nairobi Tours & Travel", need: "Safari / Tour vans", vehicles: ["Toyota Land Cruiser", "Toyota Hiace"],
    location: "Nairobi / Mombasa", website: "nairobitours.co.ke", contact: "fleet@nairobitours.co.ke", score: 79,
    reason: "Expanding operations ahead of the high tourist season. Previously enquired about Safari Land Cruisers."
  }
];

const MOCK_TASKS = [
  { id: 1, customer: "John Kamau", vehicle: "Toyota Prado TX", priority: "High", deadline: "Today", objective: "Confirm vehicle requirements, budget and financing preference. Expected outcome: Schedule showroom visit." },
  { id: 2, customer: "ABC Construction", vehicle: "Fleet (Hilux)", priority: "Medium", deadline: "Tomorrow", objective: "Introduce JUA corporate fleet solutions to procurement manager." }
];

const AISalesIntelligence = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && (!user || role?.role !== "admin")) {
      navigate("/auth");
    }
  }, [loading, user, role, navigate]);

  if (loading) return <LoadingScreen />;
  if (!user || role?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      {/* Tech grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
            <Brain className="h-3 w-3 mr-2 animate-pulse" />
            AI ENGINE: ACTIVE
          </Badge>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            AI Sales & Lead Intelligence
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Discover qualified prospects, identify high-intent buyers, monitor vehicle demand, and automate your sales outreach workflow.
          </p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-strong border-primary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">New Leads</p>
                  <h3 className="text-3xl font-black mt-2">84</h3>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-500 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" /> +12% this week
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-brand-red/30 bg-gradient-to-br from-brand-red/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-brand-red uppercase tracking-wider">Hot Leads</p>
                  <h3 className="text-3xl font-black mt-2 text-brand-red">17</h3>
                </div>
                <Flame className="h-6 w-6 text-brand-red" />
              </div>
              <div className="mt-4 flex items-center text-sm text-brand-red font-medium">
                <Target className="h-4 w-4 mr-1" /> Intent score > 80%
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">Business Opps</p>
                  <h3 className="text-3xl font-black mt-2">8</h3>
                </div>
                <Building2 className="h-6 w-6 text-amber-500" />
              </div>
              <div className="mt-4 flex items-center text-sm text-amber-600 font-medium">
                <Briefcase className="h-4 w-4 mr-1" /> Fleet requirements
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Est. Pipeline</p>
                  <h3 className="text-3xl font-black mt-2">12.4M</h3>
                </div>
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                Based on active hot leads
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="leads" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 backdrop-blur-md border border-border p-1 w-full justify-start overflow-x-auto h-auto flex-wrap">
            <TabsTrigger value="leads" className="gap-2 py-2"><Flame className="h-4 w-4" /> Hot Prospects</TabsTrigger>
            <TabsTrigger value="demand" className="gap-2 py-2"><BarChart3 className="h-4 w-4" /> Vehicle Demand</TabsTrigger>
            <TabsTrigger value="business" className="gap-2 py-2"><Building2 className="h-4 w-4" /> Business Fleet</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 py-2"><Target className="h-4 w-4" /> AI Tasks</TabsTrigger>
          </TabsList>

          {/* HOT LEADS TAB */}
          <TabsContent value="leads" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">High Intent Prospects</h2>
                <p className="text-muted-foreground">Users who have shown repeated strong buying signals.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {MOCK_HOT_LEADS.map((lead) => (
                <Card key={lead.id} className="border-brand-red/20 overflow-hidden glass hover:border-brand-red/50 transition-colors">
                  <div className="h-2 bg-gradient-to-r from-brand-red to-orange-500" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{lead.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {lead.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-lg px-3 py-1">
                          {lead.intent}% Intent
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Target Vehicle</p>
                        <p className="font-bold text-primary">{lead.vehicle}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Budget Est.</p>
                        <p className="font-bold">{lead.budget}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Financing</p>
                        <p className="font-medium">{lead.financing}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Status</p>
                        <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">Detected Activities</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.activities.map((act, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {act}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-brand-red/5 border border-brand-red/20 p-4 rounded-lg mb-6">
                      <p className="text-xs uppercase text-brand-red font-bold flex items-center gap-1 mb-1">
                        <Brain className="h-3 w-3" /> AI Recommendation
                      </p>
                      <p className="text-sm font-medium">{lead.reason}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button className="flex-1 gap-2"><Phone className="h-4 w-4" /> Contact</Button>
                      <Button variant="outline" className="flex-1 gap-2"><Briefcase className="h-4 w-4" /> Assign Sales</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* VEHICLE DEMAND TAB */}
          <TabsContent value="demand" className="space-y-6 animate-in fade-in duration-500">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Vehicle Demand Intelligence</CardTitle>
                <CardDescription>Real-time analysis of search volume, views, and enquiries across the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {MOCK_VEHICLE_DEMAND.map((vehicle, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <h4 className="font-bold text-lg">{vehicle.model}</h4>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> {vehicle.trend} 30d</span>
                            <span>Stock: {vehicle.stock}</span>
                            <span className="text-brand-red flex items-center gap-1"><Flame className="h-3 w-3" /> {vehicle.hotLeads} Hot Leads</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-2xl font-bold">{vehicle.demand}%</span>
                        </div>
                      </div>
                      <Progress value={vehicle.demand} className={`h-3 ${vehicle.demand > 80 ? '[&>div]:bg-brand-red' : vehicle.demand > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-primary'}`} />
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <h4 className="font-bold flex items-center gap-2 mb-2"><Brain className="h-5 w-5 text-primary" /> Inventory Recommendation</h4>
                  <p className="text-sm">
                    <strong>Toyota Prado</strong> demand has increased significantly over the last 30 days. You currently have 2 units available with 11 hot leads. Consider acquiring additional Prado inventory or launching a targeted campaign for existing stock.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUSINESS PROSPECTS TAB */}
          <TabsContent value="business" className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Business Prospect Discovery</h2>
                <p className="text-muted-foreground">AI-identified organizations that may require fleet vehicles.</p>
              </div>
            </div>

            <div className="grid gap-6">
              {MOCK_BUSINESS_PROSPECTS.map((biz) => (
                <Card key={biz.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="h-6 w-6 text-primary" />
                          <h3 className="text-xl font-bold">{biz.name}</h3>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Opportunity Score: {biz.score}%
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {biz.location}</span>
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {biz.website}</span>
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {biz.contact}</span>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-1">Potential Requirement:</p>
                          <p className="text-primary font-bold">{biz.need}</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold mb-2">Recommended Vehicles:</p>
                          <div className="flex flex-wrap gap-2">
                            {biz.vehicles.map((v, i) => (
                              <Badge key={i} variant="secondary">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="md:w-1/3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                        <div>
                          <p className="text-xs uppercase text-primary font-bold flex items-center gap-1 mb-2">
                            <Brain className="h-3 w-3" /> AI Analysis
                          </p>
                          <p className="text-sm text-muted-foreground">{biz.reason}</p>
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                          <Button className="w-full gap-2"><Briefcase className="h-4 w-4" /> Create Opportunity</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI TASKS TAB */}
          <TabsContent value="tasks" className="space-y-6 animate-in fade-in duration-500">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>AI Generated Sales Tasks</CardTitle>
                <CardDescription>Actionable tasks prioritized by the AI engine based on prospect intent.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_TASKS.map((task) => (
                    <div key={task.id} className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={task.priority === "High" ? "destructive" : "default"}>{task.priority} Priority</Badge>
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <BellRing className="h-3 w-3" /> Due {task.deadline}
                          </span>
                        </div>
                        <h4 className="font-bold text-lg mb-1">{task.customer} — {task.vehicle}</h4>
                        <p className="text-sm text-muted-foreground"><strong>Objective:</strong> {task.objective}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm">Mark Complete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

// Missing icon imports filler
const CheckCircle2 = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const Globe = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;

export default AISalesIntelligence;
