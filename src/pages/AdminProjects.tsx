import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Activity, Briefcase, Calendar, CheckCircle2, ChevronLeft, Download,
  FileText, Server, ShieldCheck, Sparkles, TrendingUp, Wallet, Eraser,
  Database, Cpu, Workflow, Rocket, Award,
} from "lucide-react";
import logo from "@/assets/logo.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

// System launch reference: 18 months operational (1 year & a half)
const SYSTEM_LAUNCH = new Date(new Date().getFullYear(), new Date().getMonth() - 18, 1);

const FEATURE_VALUATION: Array<{ name: string; category: string; worth: number; fn: string }> = [
  { name: "Inventory & Vehicle Catalogue", category: "Core", worth: 480000, fn: "Manage cars, motorbikes, stock IDs, pricing, images and statuses." },
  { name: "Rental Booking System", category: "Operations", worth: 320000, fn: "Bookings, status tracking, customer assignment and reporting." },
  { name: "Trade-In Workflow", category: "Operations", worth: 180000, fn: "Customer submissions, valuations and admin approvals." },
  { name: "Asset Finance Module", category: "Financial", worth: 420000, fn: "Up to 90% financing applications with document handling." },
  { name: "Pesapal Payments + IPN", category: "Financial", worth: 360000, fn: "OAuth V3 payment initiation, server-side IPN validation, PDF receipts." },
  { name: "Sales Order Lifecycle (9 stages)", category: "Financial", worth: 280000, fn: "End-to-end order tracking from quotation to delivery." },
  { name: "Customer CRM & Profiles", category: "Customers", worth: 240000, fn: "Customer accounts, segmentation, loyalty badges and notifications." },
  { name: "Notifications (Email / SMS / WhatsApp)", category: "Comms", worth: 380000, fn: "Resend, Brevo & APIWAP unified messaging with templates." },
  { name: "Auth + 2FA (Email OTP, TOTP, Fingerprint)", category: "Security", worth: 420000, fn: "Multi-factor authentication with timeout and trusted devices." },
  { name: "Role-Based Access Control", category: "Security", worth: 200000, fn: "Admin, staff and customer roles with privilege escalation guards." },
  { name: "AI Security Dashboard", category: "Security", worth: 520000, fn: "Zero Trust, AI threat scoring, anomaly detection and audit." },
  { name: "Vehicle Tracking (Mapbox + Geofences)", category: "Operations", worth: 460000, fn: "Live tracking, geofence alerts, trip history, demo simulator." },
  { name: "HRM & Attendance + Salary Receipts", category: "HR", worth: 340000, fn: "Staff, attendance, payroll and signed salary receipts." },
  { name: "Daily Reports & Analytics", category: "Reporting", worth: 260000, fn: "Daily admin reports, sales analytics and forecasting." },
  { name: "Backup & Recovery", category: "Infra", worth: 220000, fn: "Automated cron backups and dual-project recovery." },
  { name: "Documentation Generation (PDF)", category: "Reporting", worth: 180000, fn: "Auto-generated invoices, receipts, salary slips and system docs." },
  { name: "Holiday & SEO Automation", category: "Marketing", worth: 240000, fn: "28+ Kenyan holidays, automated banners, 3500+ keyword SEO strategy." },
  { name: "Social Engagement (Ratings/Comments)", category: "Customers", worth: 160000, fn: "Likes, ratings and threaded comments on vehicles & content." },
  { name: "Blogs & Videos Management", category: "Marketing", worth: 140000, fn: "Content publishing, engagement tracking and weekly reports." },
  { name: "Maintenance Mode & System Health", category: "Infra", worth: 120000, fn: "Live system health checks and graceful maintenance mode." },
];

const TOTAL_SYSTEM_WORTH = FEATURE_VALUATION.reduce((s, f) => s + f.worth, 0);

interface WorkItem {
  id: string;
  created_at: string;
  action: string;
  target: string;
  source: "activity" | "admin";
  details?: any;
}

const monthsSinceLaunch = () => {
  const now = new Date();
  return (now.getFullYear() - SYSTEM_LAUNCH.getFullYear()) * 12 + (now.getMonth() - SYSTEM_LAUNCH.getMonth());
};

const AdminProjects = () => {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [sigDrawing, setSigDrawing] = useState(false);
  const sigRef = useRef<HTMLCanvasElement | null>(null);
  const [healthOk, setHealthOk] = useState<boolean>(true);
  const [counts, setCounts] = useState({ cars: 0, motorbikes: 0, sales: 0, customers: 0, rentals: 0, tradeIns: 0 });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role?.role !== "admin")) navigate("/auth");
  }, [loading, user, role, navigate]);

  useEffect(() => {
    if (user && role?.role === "admin") loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const loadAll = async () => {
    setFetching(true);
    try {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
      const [acts, adminLogs, cars, bikes, sales, profiles, rentals, tradeIns] = await Promise.all([
        supabase.from("activity_logs").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
        supabase.from("admin_logs").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
        supabase.from("cars").select("id", { count: "exact", head: true }),
        supabase.from("motorbikes").select("id", { count: "exact", head: true }),
        supabase.from("sales").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("rental_bookings").select("id", { count: "exact", head: true }),
        supabase.from("trade_in_requests").select("id", { count: "exact", head: true }),
      ]);

      const merged: WorkItem[] = [];
      (acts.data || []).forEach((a: any) => merged.push({
        id: a.id, created_at: a.created_at, action: a.action_type,
        target: `${a.target_table || ""} ${a.target_id ? "#" + String(a.target_id).slice(0, 8) : ""}`.trim() || "—",
        source: "activity", details: a.details,
      }));
      (adminLogs.data || []).forEach((a: any) => merged.push({
        id: a.id, created_at: a.created_at, action: a.action,
        target: a.details ? Object.keys(a.details).slice(0, 2).join(", ") : "—",
        source: "admin", details: a.details,
      }));
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setItems(merged);
      setCounts({
        cars: cars.count || 0,
        motorbikes: bikes.count || 0,
        sales: sales.count || 0,
        customers: profiles.count || 0,
        rentals: rentals.count || 0,
        tradeIns: tradeIns.count || 0,
      });

      // System health ping
      try {
        const { error } = await supabase.from("cars").select("id").limit(1);
        setHealthOk(!error);
      } catch { setHealthOk(false); }
    } catch (e: any) {
      toast({ title: "Failed to load work data", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const todayWork = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return items.filter(i => new Date(i.created_at) >= today);
  }, [items]);

  const weekWork = useMemo(() => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return items.filter(i => new Date(i.created_at) >= since);
  }, [items]);

  // Pay calculation: KSh 250 per logged action today
  const PAY_PER_ACTION = 250;
  const estimatedPay = todayWork.length * PAY_PER_ACTION;

  // --- Signature canvas ---
  const startSig = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = sigRef.current; if (!c) return;
    setSigDrawing(true);
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = "#0b1f4d"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath();
    const r = c.getBoundingClientRect();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const moveSig = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sigDrawing) return;
    const c = sigRef.current!; const ctx = c.getContext("2d")!;
    const r = c.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
  };
  const endSig = () => setSigDrawing(false);
  const clearSig = () => {
    const c = sigRef.current; if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  // --- PDF generation ---
  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const PRIMARY: [number, number, number] = [11, 31, 77];
      const GOLD: [number, number, number] = [201, 168, 76];

      // load logo
      const logoData = await fetch(logo).then(r => r.blob()).then(b => new Promise<string>(res => {
        const fr = new FileReader(); fr.onloadend = () => res(String(fr.result)); fr.readAsDataURL(b);
      }));

      const reportId = `JUA-PRJ-${Date.now().toString().slice(-8)}`;
      const generatedAt = new Date().toLocaleString();

      // generate QR + barcode dataurls
      const qrData = await QRCode.toDataURL(JSON.stringify({
        report: reportId, admin: profile?.full_name, date: generatedAt, total_worth: TOTAL_SYSTEM_WORTH,
      }), { width: 220, margin: 1 });
      const barCanvas = document.createElement("canvas");
      JsBarcode(barCanvas, reportId, { format: "CODE39", height: 50, displayValue: true, fontSize: 12 });
      const barData = barCanvas.toDataURL("image/png");

      const drawHeader = (pageNo: number, total: number) => {
        // Top band
        doc.setFillColor(...PRIMARY);
        doc.rect(0, 0, W, 70, "F");
        doc.setFillColor(...GOLD);
        doc.rect(0, 70, W, 3, "F");
        try { doc.addImage(logoData, "PNG", 24, 12, 46, 46); } catch {}
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold"); doc.setFontSize(15);
        doc.text("JUSTICE ULTIMATE AUTOMOBILES", 82, 32);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text("Trusted. Reliable. With you every step of the way.", 82, 46);
        doc.text("Mpesi Lane 11, Westlands, Nairobi · 0722 827 458 / 0751 555 544", 82, 58);
        doc.setTextColor(255, 215, 100);
        doc.text("CONFIDENTIAL · PROJECT WORK REPORT", W - 24, 32, { align: "right" });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`Report #: ${reportId}`, W - 24, 46, { align: "right" });
        doc.text(`Page ${pageNo} of ${total}`, W - 24, 58, { align: "right" });
      };

      const drawFooter = () => {
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
        doc.line(24, H - 50, W - 24, H - 50);
        doc.setTextColor(80, 80, 80); doc.setFontSize(8);
        doc.text("© " + new Date().getFullYear() + " Justice Ultimate Automobiles · Justice Ultimate System v2", W / 2, H - 34, { align: "center" });
        doc.text("www.justiceultimateautomobiles.com · info@justiceultimateautomobiles.com", W / 2, H - 22, { align: "center" });
      };

      // Watermark
      const drawWatermark = () => {
        doc.saveGraphicsState?.();
        doc.setTextColor(220, 220, 220);
        doc.setFontSize(72);
        doc.text("JUSTICE ULTIMATE", W / 2, H / 2 + 30, { align: "center", angle: 30 });
        doc.restoreGraphicsState?.();
      };

      const newPage = () => { doc.addPage(); drawWatermark(); };

      // PAGE 1 — Cover
      drawWatermark();
      drawHeader(1, 5);
      doc.setTextColor(...PRIMARY);
      doc.setFont("helvetica", "bold"); doc.setFontSize(26);
      doc.text("Project Work Report", W / 2, 130, { align: "center" });
      doc.setFontSize(13); doc.setTextColor(80, 80, 80);
      doc.text("Comprehensive System Overview, Daily Work Log & Valuation", W / 2, 152, { align: "center" });

      // Stats tiles
      const tiles = [
        { label: "Vehicles", value: counts.cars, icon: "🚗" },
        { label: "Motorbikes", value: counts.motorbikes, icon: "🏍" },
        { label: "Customers", value: counts.customers, icon: "👥" },
        { label: "Sales", value: counts.sales, icon: "💼" },
        { label: "Rentals", value: counts.rentals, icon: "🔑" },
        { label: "Trade-ins", value: counts.tradeIns, icon: "🔁" },
      ];
      const tileW = (W - 48 - 10) / 3; const tileH = 70;
      tiles.forEach((t, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = 24 + col * (tileW + 5), y = 180 + row * (tileH + 8);
        doc.setFillColor(245, 247, 252); doc.roundedRect(x, y, tileW, tileH, 6, 6, "F");
        doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.8); doc.roundedRect(x, y, tileW, tileH, 6, 6, "S");
        doc.setFillColor(...GOLD); doc.rect(x, y, 4, tileH, "F");
        doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
        doc.text(String(t.value), x + 14, y + 38);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 90, 90);
        doc.text(t.label.toUpperCase(), x + 14, y + 56);
      });

      // System info block
      const months = monthsSinceLaunch();
      const launchStr = SYSTEM_LAUNCH.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
      doc.setFillColor(11, 31, 77); doc.roundedRect(24, 360, W - 48, 90, 6, 6, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("System Status", 36, 384);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.text(`Launch Date: ${launchStr}`, 36, 404);
      doc.text(`Operational For: ${months} months (1 year & a half)`, 36, 420);
      doc.text(`Health Check: ${healthOk ? "✓ Fully Operational" : "⚠ Degraded"}`, 36, 436);
      doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold");
      doc.text(`Total System Worth: KSh ${TOTAL_SYSTEM_WORTH.toLocaleString()}`, W - 36, 420, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setTextColor(255, 255, 255); doc.setFontSize(9);
      doc.text(`Generated: ${generatedAt}`, W - 36, 436, { align: "right" });

      // Admin
      doc.setTextColor(...PRIMARY); doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(`Prepared by: ${profile?.full_name || "Administrator"}`, 24, 480);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
      doc.text(`Email: ${profile?.email || "—"}`, 24, 496);
      doc.text(`Role: Administrator`, 24, 510);
      drawFooter();

      // PAGE 2 — System Feature Valuation
      newPage(); drawHeader(2, 5);
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("System Feature Inventory & Valuation", 24, 110);
      autoTable(doc, {
        startY: 124,
        head: [["#", "Feature", "Category", "Function", "Worth (KSh)"]],
        body: FEATURE_VALUATION.map((f, i) => [i + 1, f.name, f.category, f.fn, f.worth.toLocaleString()]),
        styles: { fontSize: 8.5, cellPadding: 4, textColor: [40, 40, 40] },
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 252] },
        columnStyles: { 0: { cellWidth: 22, halign: "center" }, 4: { halign: "right", fontStyle: "bold" } },
        foot: [["", "TOTAL", "", "", TOTAL_SYSTEM_WORTH.toLocaleString()]],
        footStyles: { fillColor: GOLD, textColor: PRIMARY, fontStyle: "bold" },
        margin: { left: 24, right: 24 },
      });
      drawFooter();

      // PAGE 3 — Today's Work
      newPage(); drawHeader(3, 5);
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("Daily Work Log — " + new Date().toLocaleDateString("en-GB"), 24, 110);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 90, 90);
      doc.text(`Actions today: ${todayWork.length}  ·  This week: ${weekWork.length}`, 24, 128);

      autoTable(doc, {
        startY: 144,
        head: [["Time", "Action", "Target", "Source"]],
        body: (todayWork.length ? todayWork : [{ created_at: new Date().toISOString(), action: "No actions recorded today", target: "—", source: "activity" } as WorkItem])
          .slice(0, 40)
          .map(i => [
            new Date(i.created_at).toLocaleTimeString(),
            i.action,
            i.target,
            i.source === "admin" ? "Admin Log" : "Activity",
          ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: PRIMARY, textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 252] },
        margin: { left: 24, right: 24 },
      });

      // Pay block
      const yPay = (doc as any).lastAutoTable.finalY + 20;
      doc.setFillColor(...GOLD); doc.roundedRect(24, yPay, W - 48, 60, 6, 6, "F");
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Estimated Pay (Work Done Today)", 36, yPay + 22);
      doc.setFontSize(22);
      doc.text(`KSh ${estimatedPay.toLocaleString()}`, W - 36, yPay + 30, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(`Computed at KSh ${PAY_PER_ACTION} per logged action × ${todayWork.length} actions`, 36, yPay + 44);
      drawFooter();

      // PAGE 4 — Notes & Signature
      newPage(); drawHeader(4, 5);
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("Administrator Notes", 24, 110);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(40, 40, 40);
      const notes = (adminNotes || "No additional notes provided.").trim();
      const lines = doc.splitTextToSize(notes, W - 48);
      doc.text(lines, 24, 132);

      // Signature
      const sigY = 132 + lines.length * 14 + 30;
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Digital Signature", 24, sigY);
      doc.setDrawColor(...PRIMARY); doc.rect(24, sigY + 8, 260, 80);
      try {
        const sigImg = sigRef.current?.toDataURL("image/png");
        if (sigImg) doc.addImage(sigImg, "PNG", 26, sigY + 10, 256, 76);
      } catch {}
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90, 90, 90);
      doc.text(`Signed by: ${profile?.full_name || "Administrator"}`, 24, sigY + 102);
      doc.text(`On: ${generatedAt}`, 24, sigY + 116);
      drawFooter();

      // PAGE 5 — Verification (QR + Barcode)
      newPage(); drawHeader(5, 5);
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("Verification & Authenticity", 24, 110);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      doc.text("Scan the QR code or verify the barcode reference number for authenticity.", 24, 132);

      doc.addImage(qrData, "PNG", 24, 150, 160, 160);
      doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text("Scan to verify report metadata", 104, 320, { align: "center" });

      doc.addImage(barData, "PNG", 220, 180, 320, 90);
      doc.text("Report Reference Barcode (CODE39)", 380, 285, { align: "center" });

      // Summary box
      doc.setFillColor(245, 247, 252); doc.roundedRect(24, 360, W - 48, 110, 6, 6, "F");
      doc.setDrawColor(...PRIMARY); doc.roundedRect(24, 360, W - 48, 110, 6, 6, "S");
      doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Report Summary", 36, 382);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40, 40, 40);
      doc.text(`• System launched: ${launchStr}`, 36, 402);
      doc.text(`• Operational for: ${months} months (1 year & a half)`, 36, 416);
      doc.text(`• System status: ${healthOk ? "Fully Operational" : "Degraded"}`, 36, 430);
      doc.text(`• Total features tracked: ${FEATURE_VALUATION.length}`, 36, 444);
      doc.text(`• Total system worth: KSh ${TOTAL_SYSTEM_WORTH.toLocaleString()}`, 36, 458);
      drawFooter();

      doc.save(`Justice-Project-Report-${reportId}.pdf`);
      toast({ title: "Report downloaded", description: `Report #${reportId} generated successfully.` });
    } catch (e: any) {
      toast({ title: "PDF generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (loading || fetching) return <LoadingScreen />;

  const months = monthsSinceLaunch();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Tech grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-6 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <Badge variant="outline" className="font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
            PROJECT // {healthOk ? "OPERATIONAL" : "DEGRADED"}
          </Badge>
        </div>

        {/* Hero */}
        <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background/40 to-yellow-500/10 backdrop-blur-xl p-6 md:p-8 mb-6 overflow-hidden">
          <div className="absolute top-0 left-0 h-px w-32 bg-gradient-to-r from-primary to-transparent" />
          <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-primary to-transparent" />
          <div className="absolute bottom-0 right-0 h-px w-32 bg-gradient-to-l from-yellow-400 to-transparent" />
          <div className="absolute bottom-0 right-0 w-px h-32 bg-gradient-to-t from-yellow-400 to-transparent" />

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-7 w-7 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Project · Work Done</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Full-scope system report — daily work log, feature inventory, valuation, health and signed PDF export determining administrator pay.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className="bg-primary/20 text-primary border-primary/40"><Rocket className="h-3 w-3 mr-1" />Operational {months} months</Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40"><Activity className="h-3 w-3 mr-1" />Live tracking</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40"><Award className="h-3 w-3 mr-1" />Worth KSh {TOTAL_SYSTEM_WORTH.toLocaleString()}</Badge>
              </div>
            </div>
            <Button size="lg" className="gap-2" onClick={generatePDF} disabled={generating}>
              <Download className="h-5 w-5" />
              {generating ? "Generating..." : "Download Project Report (PDF)"}
            </Button>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Actions Today", value: todayWork.length, icon: Activity, accent: "from-primary/30 to-primary/5" },
            { label: "This Week", value: weekWork.length, icon: TrendingUp, accent: "from-emerald-500/30 to-emerald-500/5" },
            { label: "Vehicles", value: counts.cars, icon: Cpu, accent: "from-blue-500/30 to-blue-500/5" },
            { label: "Customers", value: counts.customers, icon: Database, accent: "from-purple-500/30 to-purple-500/5" },
            { label: "Sales", value: counts.sales, icon: Workflow, accent: "from-yellow-500/30 to-yellow-500/5" },
            { label: "Est. Pay (KSh)", value: estimatedPay.toLocaleString(), icon: Wallet, accent: "from-emerald-500/30 to-yellow-500/10" },
          ].map((k, i) => (
            <Card key={i} className="relative overflow-hidden border border-primary/30 bg-card/70 backdrop-blur-md">
              <div className={`absolute inset-0 bg-gradient-to-br ${k.accent} opacity-40`} />
              <span className="absolute top-0 left-0 h-px w-10 bg-primary" />
              <span className="absolute top-0 left-0 w-px h-10 bg-primary" />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{k.label}</span>
                  <k.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold tabular-nums">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="work" className="space-y-4">
          <TabsList className="bg-card/70 backdrop-blur border border-primary/20">
            <TabsTrigger value="work"><Activity className="h-4 w-4 mr-1" />Daily Work</TabsTrigger>
            <TabsTrigger value="features"><Sparkles className="h-4 w-4 mr-1" />Features & Worth</TabsTrigger>
            <TabsTrigger value="health"><ShieldCheck className="h-4 w-4 mr-1" />System Health</TabsTrigger>
            <TabsTrigger value="notes"><FileText className="h-4 w-4 mr-1" />Notes & Signature</TabsTrigger>
          </TabsList>

          {/* Daily Work */}
          <TabsContent value="work">
            <Card className="border-primary/30 bg-card/70 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Today's Activity ({todayWork.length})</h3>
                </div>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                  {todayWork.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No actions logged today yet.</p>
                  ) : todayWork.map(i => (
                    <div key={i.id} className="flex items-start gap-3 p-3 rounded-lg border border-primary/15 bg-background/50 hover:border-primary/40 transition-colors">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{i.action}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(i.created_at).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{i.target}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{i.source}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURE_VALUATION.map((f) => (
                <Card key={f.name} className="border-primary/30 bg-card/70 backdrop-blur-md relative overflow-hidden group hover:border-primary/60 transition-all">
                  <span className="absolute top-0 left-0 h-px w-8 bg-primary opacity-0 group-hover:opacity-100 transition" />
                  <span className="absolute top-0 left-0 w-px h-8 bg-primary opacity-0 group-hover:opacity-100 transition" />
                  <CardContent className="p-4">
                    <Badge variant="outline" className="text-[10px] mb-2">{f.category}</Badge>
                    <h4 className="font-semibold leading-tight mb-1">{f.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{f.fn}</p>
                    <div className="text-emerald-400 font-mono font-bold">KSh {f.worth.toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-primary/10 flex items-center justify-between">
              <span className="font-semibold">Total System Worth</span>
              <span className="text-2xl font-bold text-yellow-400 font-mono">KSh {TOTAL_SYSTEM_WORTH.toLocaleString()}</span>
            </div>
          </TabsContent>

          {/* Health */}
          <TabsContent value="health">
            <Card className="border-primary/30 bg-card/70 backdrop-blur-md">
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><span className="font-semibold">Database</span></div>
                    <p className="text-xs text-muted-foreground">{healthOk ? "Reachable, responses normal." : "Connection issues detected."}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-primary/40 bg-primary/10">
                    <div className="flex items-center gap-2 mb-2"><Server className="h-5 w-5 text-primary" /><span className="font-semibold">Application</span></div>
                    <p className="text-xs text-muted-foreground">Frontend & edge functions operational.</p>
                  </div>
                  <div className="p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10">
                    <div className="flex items-center gap-2 mb-2"><Rocket className="h-5 w-5 text-yellow-400" /><span className="font-semibold">Uptime</span></div>
                    <p className="text-xs text-muted-foreground">Operating {months} months since launch ({SYSTEM_LAUNCH.toLocaleDateString()}).</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes & Signature */}
          <TabsContent value="notes">
            <Card className="border-primary/30 bg-card/70 backdrop-blur-md">
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label htmlFor="notes" className="mb-2 block">Additional Notes for the Report</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any context about today's work, highlights, blockers, or special remarks..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[140px]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Digital Signature</Label>
                    <Button variant="ghost" size="sm" onClick={clearSig}><Eraser className="h-4 w-4 mr-1" />Clear</Button>
                  </div>
                  <canvas
                    ref={sigRef}
                    width={520}
                    height={140}
                    className="w-full max-w-xl border border-primary/40 rounded-lg bg-white touch-none"
                    onPointerDown={startSig}
                    onPointerMove={moveSig}
                    onPointerUp={endSig}
                    onPointerLeave={endSig}
                  />
                  <p className="text-xs text-muted-foreground mt-2">Sign above with mouse, pen or finger. The signature is embedded into the PDF report.</p>
                </div>
                <Button size="lg" className="gap-2" onClick={generatePDF} disabled={generating}>
                  <Download className="h-5 w-5" />
                  {generating ? "Generating..." : "Generate & Download Report"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminProjects;
