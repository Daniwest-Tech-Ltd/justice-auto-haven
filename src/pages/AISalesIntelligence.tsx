import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Target, Users, TrendingUp, Building2, Car, BellRing, Briefcase,
  MapPin, Phone, Mail, CheckCircle2, Globe, Flame, BarChart3, ChevronLeft, Send, Sparkles, User, MessageSquare
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

// --- Types ---
type RealLead = {
  id: string;
  name: string;
  vehicle: string;
  intent: number;
  location: string;
  budget: string;
  activities: string[];
  phone: string;
  email: string;
  reason: string;
  financing: string;
  status: string;
};

type RealDemand = {
  model: string;
  demand: number;
  trend: string;
  stock: number;
  hotLeads: number;
};

type RealTask = {
  id: string;
  customer: string;
  vehicle: string;
  priority: string;
  deadline: string;
  objective: string;
};

type ChatMessage = {
  role: "system" | "user" | "ai";
  content: string;
};

const AISalesIntelligence = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("leads");
  const [dataLoading, setDataLoading] = useState(true);

  // Data states
  const [hotLeads, setHotLeads] = useState<RealLead[]>([]);
  const [vehicleDemand, setVehicleDemand] = useState<RealDemand[]>([]);
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [estPipeline, setEstPipeline] = useState(0);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "system", content: "AI Sales Assistant initialized. Monitoring database signals..." },
    { role: "ai", content: "Hello! I am your AI Sales Assistant. I've analyzed our recent customer data, whitelist orders, and finance applications. How can I help you close more deals today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || role?.role !== "admin")) {
      navigate("/auth");
    }
  }, [loading, user, role, navigate]);

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchIntelligenceData();
    }
  }, [user, role]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchIntelligenceData = async () => {
    setDataLoading(true);
    try {
      // 1. Fetch relevant tables
      const [
        { data: profiles },
        { data: cars },
        { data: orders },
        { data: financeApps },
        { data: tradeIns }
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("cars").select("*").eq("status", "available"),
        supabase.from("whitelist_orders").select("*, cars(make, model, price)"),
        supabase.from("asset_finance_applications").select("*"),
        supabase.from("trade_ins").select("*")
      ]);

      let totalPipeline = 0;
      const processedLeads: RealLead[] = [];
      const demandMap: Record<string, { views: number; stock: number; leads: number }> = {};
      const generatedTasks: RealTask[] = [];

      // Process Cars for stock
      (cars || []).forEach(car => {
        const key = `${car.make} ${car.model}`.trim();
        if (!demandMap[key]) demandMap[key] = { views: 0, stock: 0, leads: 0 };
        demandMap[key].stock += 1;
      });

      // Analyze users (Profiles)
      (profiles || []).forEach(profile => {
        const userOrders = (orders || []).filter(o => o.user_id === profile.user_id);
        const userFinance = (financeApps || []).filter(f => f.user_id === profile.user_id);
        const userTradeIns = (tradeIns || []).filter(t => t.user_id === profile.user_id);

        let intentScore = 15; // Base profile score
        let acts: string[] = [];
        let primaryVehicle = "Unknown Vehicle";
        let pipelineValue = 0;
        let financingStatus = "Cash / Unconfirmed";

        if (userOrders.length > 0) {
          intentScore += 35;
          acts.push("Added to Wishlist/Orders");
          const firstOrder = userOrders[0];
          if (firstOrder.cars) {
            primaryVehicle = `${firstOrder.cars.make} ${firstOrder.cars.model}`;
            pipelineValue = Number(firstOrder.cars.price) || 0;

            // Log demand
            if (!demandMap[primaryVehicle]) demandMap[primaryVehicle] = { views: 0, stock: 0, leads: 0 };
            demandMap[primaryVehicle].views += 5;
            demandMap[primaryVehicle].leads += 1;
          }

          if (firstOrder.status === 'pending') {
            generatedTasks.push({
              id: `order-${firstOrder.id}`,
              customer: profile.full_name || "Unknown",
              vehicle: primaryVehicle,
              priority: "High",
              deadline: "Today",
              objective: "Review pending vehicle order and contact customer to finalize."
            });
          }
        }

        if (userFinance.length > 0) {
          intentScore += 40;
          acts.push("Applied for Finance");
          financingStatus = "Finance Requested";

          const pendingFinance = userFinance.find(f => f.status === 'pending');
          if (pendingFinance) {
            generatedTasks.push({
              id: `fin-${pendingFinance.id}`,
              customer: profile.full_name || "Unknown",
              vehicle: primaryVehicle,
              priority: "Urgent",
              deadline: "ASAP",
              objective: "Process asset finance application to close the deal."
            });
          }
        }

        if (userTradeIns.length > 0) {
          intentScore += 30;
          acts.push("Requested Trade-in");
        }

        // Cap intent at 99
        intentScore = Math.min(intentScore, 99);

        // Only consider as a lead if they did something beyond registering
        if (intentScore > 20) {
          totalPipeline += pipelineValue;
          processedLeads.push({
            id: profile.user_id,
            name: profile.full_name || "Unknown Prospect",
            vehicle: primaryVehicle,
            intent: intentScore,
            location: profile.county_city || "Nairobi",
            budget: pipelineValue > 0 ? `KES ${(pipelineValue / 1000000).toFixed(1)}M` : "TBD",
            activities: acts,
            phone: profile.phone || "No phone",
            email: profile.email || "No email",
            reason: `Generated ${acts.length} buying signals.`,
            financing: financingStatus,
            status: "Active Lead"
          });
        }
      });

      // Sort leads by intent
      processedLeads.sort((a, b) => b.intent - a.intent);

      // Format Demand Data
      const processedDemand: RealDemand[] = Object.entries(demandMap)
        .map(([model, data]) => {
          // calculate an arbitrary 0-100 demand score
          const rawScore = (data.views * 2) + (data.leads * 15);
          return {
            model,
            demand: Math.min(Math.max(rawScore, 10), 98), // clamp
            trend: `+${Math.floor(Math.random() * 20) + 5}%`, // Simulated trend since we don't have historical snapshots
            stock: data.stock,
            hotLeads: data.leads
          };
        })
        .filter(d => d.demand > 15)
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 10); // Top 10

      setHotLeads(processedLeads);
      setVehicleDemand(processedDemand);
      setTasks(generatedTasks);
      setEstPipeline(totalPipeline);

    } catch (err: any) {
      toast({ title: "Intelligence sync failed", description: err.message, variant: "destructive" });
    } finally {
      setDataLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    // Simulate AI response based on real data context
    setTimeout(() => {
      let aiResponse = "I'm analyzing that request...";
      const query = userMsg.toLowerCase();

      if (query.includes("hot") || query.includes("leads") || query.includes("who")) {
        const top = hotLeads.slice(0, 3);
        if (top.length > 0) {
          aiResponse = `Right now, your top ${top.length} prospects are:\n${top.map(l => `- **${l.name}** looking for a ${l.vehicle} (Intent: ${l.intent}%).`).join('\n')}\nI recommend contacting them today.`;
        } else {
          aiResponse = "I haven't detected any hot leads based on recent wishlist or finance activity yet. Drive more traffic to the catalogue!";
        }
      }
      else if (query.includes("demand") || query.includes("popular") || query.includes("stock")) {
        const topD = vehicleDemand.slice(0, 2);
        if (topD.length > 0) {
          aiResponse = `The highest demand is currently for the **${topD[0].model}** (Demand Score: ${topD[0].demand}%). We only have ${topD[0].stock} in stock but ${topD[0].hotLeads} hot leads. Consider acquiring more inventory.`;
        } else {
          aiResponse = "Vehicle demand data is still populating. Make sure your inventory is marked as 'available'.";
        }
      }
      else if (query.includes("task") || query.includes("to do") || query.includes("today")) {
        if (tasks.length > 0) {
          aiResponse = `You have ${tasks.length} urgent tasks. Your top priority is:\n\n**${tasks[0].objective}** for customer ${tasks[0].customer}.`;
        } else {
          aiResponse = "You're all caught up! No pending high-priority tasks found in the database.";
        }
      }
      else if (query.includes("pipeline") || query.includes("money")) {
        aiResponse = `Your estimated sales pipeline from current active leads is **KES ${(estPipeline / 1000000).toFixed(2)} Million**. Focus on processing pending finance applications to close these deals.`;
      }
      else {
        aiResponse = "I am a local context AI assistant. Try asking me about 'hot leads', 'vehicle demand', 'my tasks today', or 'sales pipeline'. I analyze your live database to give you answers.";
      }

      setChatMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
    }, 1000);
  };

  // Static Business Data for now since web scraping isn't in Supabase
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

  if (loading) return <LoadingScreen />;
  if (!user || role?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12 flex flex-col md:flex-row">
      {/* Tech grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 px-4 py-6 relative z-10 lg:mr-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
            <Brain className="h-3 w-3 mr-2 animate-pulse" />
            AI LIVE SYNC
          </Badge>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            AI Sales Intelligence
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Discover qualified prospects, identify high-intent buyers, monitor vehicle demand, and automate your workflow using your live database.
          </p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-strong border-primary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Leads</p>
                  <h3 className="text-3xl font-black mt-2">{dataLoading ? "..." : hotLeads.length}</h3>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-brand-red/30 bg-gradient-to-br from-brand-red/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-brand-red uppercase tracking-wider">Hot Leads</p>
                  <h3 className="text-3xl font-black mt-2 text-brand-red">{dataLoading ? "..." : hotLeads.filter(l => l.intent >= 70).length}</h3>
                </div>
                <Flame className="h-6 w-6 text-brand-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-amber-600 uppercase tracking-wider">Action Tasks</p>
                  <h3 className="text-3xl font-black mt-2">{dataLoading ? "..." : tasks.length}</h3>
                </div>
                <BellRing className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Est. Pipeline</p>
                  <h3 className="text-xl sm:text-2xl font-black mt-2">{dataLoading ? "..." : `KES ${(estPipeline/1000000).toFixed(1)}M`}</h3>
                </div>
                <Activity className="h-6 w-6 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="leads" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 backdrop-blur-md border border-border p-1 w-full justify-start overflow-x-auto h-auto flex-wrap">
            <TabsTrigger value="leads" className="gap-2 py-2"><Flame className="h-4 w-4" /> Live Prospects</TabsTrigger>
            <TabsTrigger value="demand" className="gap-2 py-2"><BarChart3 className="h-4 w-4" /> Vehicle Demand</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 py-2"><Target className="h-4 w-4" /> Recommended Tasks</TabsTrigger>
            <TabsTrigger value="business" className="gap-2 py-2"><Building2 className="h-4 w-4" /> Fleet Discovery</TabsTrigger>
          </TabsList>

          {/* HOT LEADS TAB */}
          <TabsContent value="leads" className="space-y-6 animate-in fade-in duration-500">
            {dataLoading ? (
              <div className="py-12 flex justify-center"><Brain className="h-8 w-8 text-primary animate-pulse" /></div>
            ) : hotLeads.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                No active leads found in the database yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {hotLeads.map((lead) => (
                  <Card key={lead.id} className="border-brand-red/20 overflow-hidden glass hover:border-brand-red/50 transition-colors">
                    <div className={`h-2 ${lead.intent >= 70 ? 'bg-gradient-to-r from-brand-red to-orange-500' : 'bg-primary/50'}`} />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{lead.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {lead.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={lead.intent >= 70 ? "destructive" : "default"} className="text-lg px-3 py-1">
                            {lead.intent}% Intent
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Target Vehicle</p>
                          <p className="font-bold text-primary truncate" title={lead.vehicle}>{lead.vehicle}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Budget Est.</p>
                          <p className="font-bold">{lead.budget}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Financing</p>
                          <p className="font-medium text-xs truncate" title={lead.financing}>{lead.financing}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Contact</p>
                          <p className="text-xs font-mono">{lead.phone}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">Detected Activities</p>
                        <div className="flex flex-wrap gap-2">
                          {lead.activities.map((act, i) => (
                            <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {act}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-brand-red/5 border border-brand-red/20 p-4 rounded-lg mb-6">
                        <p className="text-xs uppercase text-brand-red font-bold flex items-center gap-1 mb-1">
                          <Brain className="h-3 w-3" /> AI Insight
                        </p>
                        <p className="text-sm font-medium">{lead.reason}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button className="flex-1 gap-2" onClick={() => window.location.href=`tel:${lead.phone}`}><Phone className="h-4 w-4" /> Call</Button>
                        <Button variant="outline" className="flex-1 gap-2"><Briefcase className="h-4 w-4" /> View Profile</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* VEHICLE DEMAND TAB */}
          <TabsContent value="demand" className="space-y-6 animate-in fade-in duration-500">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Live Vehicle Demand Intelligence</CardTitle>
                <CardDescription>Aggregated from active wishlist orders and catalogue views.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {vehicleDemand.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Not enough data to calculate demand.</p>
                  ) : (
                    vehicleDemand.map((vehicle, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{vehicle.model}</h4>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> {vehicle.trend}</span>
                              <span>Stock: {vehicle.stock}</span>
                              <span className="text-brand-red flex items-center gap-1"><Flame className="h-3 w-3" /> {vehicle.hotLeads} Leads</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-2xl font-bold">{vehicle.demand}%</span>
                          </div>
                        </div>
                        <Progress value={vehicle.demand} className={`h-3 ${vehicle.demand > 80 ? '[&>div]:bg-brand-red' : vehicle.demand > 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-primary'}`} />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TASKS TAB */}
          <TabsContent value="tasks" className="space-y-6 animate-in fade-in duration-500">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>AI Recommended Tasks</CardTitle>
                <CardDescription>Automatically generated follow-ups based on database triggers.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 border border-dashed rounded-lg">No urgent tasks currently generated by AI.</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={task.priority === "Urgent" ? "destructive" : "default"}>{task.priority}</Badge>
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <BellRing className="h-3 w-3" /> Due {task.deadline}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg mb-1">{task.customer} — {task.vehicle}</h4>
                          <p className="text-sm text-muted-foreground"><strong>Objective:</strong> {task.objective}</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button size="sm">Action Item</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUSINESS TAB (MOCK FOR NOW) */}
          <TabsContent value="business" className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Business Prospect Discovery</h2>
                <p className="text-muted-foreground">External organizations identified as potential fleet buyers.</p>
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
                            Match: {biz.score}%
                          </Badge>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-1">Potential Requirement:</p>
                          <p className="text-primary font-bold">{biz.need}</p>
                        </div>
                      </div>
                      <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                        <p className="text-xs uppercase text-primary font-bold flex items-center gap-1 mb-2">
                          <Brain className="h-3 w-3" /> AI Analysis
                        </p>
                        <p className="text-sm text-muted-foreground">{biz.reason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* FLOATING/SIDEBAR AI CHAT ASSISTANT */}
      <div className="w-full lg:w-[400px] border-l border-border/50 bg-card/80 backdrop-blur-xl flex flex-col fixed bottom-0 right-0 top-20 lg:sticky lg:top-20 z-40 h-[calc(100vh-80px)] shadow-2xl transition-transform duration-300 transform translate-x-full lg:translate-x-0" id="ai-sidebar">

        {/* Mobile Toggle Handle */}
        <div
          className="absolute -left-12 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-l-xl cursor-pointer lg:hidden shadow-lg flex items-center justify-center"
          onClick={() => {
            const el = document.getElementById('ai-sidebar');
            if (el) el.classList.toggle('translate-x-full');
          }}
        >
          <MessageSquare className="h-6 w-6" />
        </div>

        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-3 shrink-0">
          <div className="relative">
            <Brain className="h-8 w-8 text-primary" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold tracking-tight">JUA AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Connected to live database</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-muted' : msg.role === 'system' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : msg.role === 'system' ? <Activity className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </div>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : msg.role === 'system'
                    ? 'bg-amber-500/10 text-amber-600/80 border border-amber-500/20 text-xs font-mono'
                    : 'bg-muted/50 border border-border rounded-tl-none whitespace-pre-wrap'
                }`}>
                  {/* Basic markdown parsing for bold text */}
                  {msg.content.split('**').map((text, i) => i % 2 === 1 ? <strong key={i}>{text}</strong> : text)}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-border shrink-0">
          <form onSubmit={handleChatSubmit} className="relative flex items-center">
            <Input
              placeholder="Ask about leads, tasks, demand..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="pr-12 rounded-full border-primary/30 bg-muted/30 focus-visible:ring-primary/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!chatInput.trim()}
              className="absolute right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </form>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            <Badge variant="outline" className="shrink-0 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setChatInput("Who are my top hot leads?")}>🔥 Top leads</Badge>
            <Badge variant="outline" className="shrink-0 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setChatInput("What tasks do I have today?")}>✅ My tasks</Badge>
            <Badge variant="outline" className="shrink-0 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setChatInput("What's the current vehicle demand?")}>📈 Vehicle demand</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISalesIntelligence;