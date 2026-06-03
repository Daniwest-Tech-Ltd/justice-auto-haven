import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Lock, Clock } from "lucide-react";
import jsPDF from "jspdf";

type KillSwitchState = {
  kill_switch_active: boolean;
  kill_switch_until: string | null;
  kill_switch_activated_at: string | null;
  billing_total_usd: number;
  billing_vercel_usd: number;
  billing_render_usd: number;
  billing_resend_usd: number;
  billing_supabase_usd: number;
  billing_due_date: string;
  message?: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export const downloadKillSwitchInvoice = (s: KillSwitchState) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const due = new Date(s.billing_due_date).toDateString();
  const today = new Date().toDateString();
  const invoiceNo = `JUA-SVC-${Date.now().toString().slice(-8)}`;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("JUSTICE ULTIMATE AUTOMOBILES", 40, 38);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Service Infrastructure Invoice", 40, 56);
  doc.text(`Invoice #: ${invoiceNo}`, W - 40, 38, { align: "right" });
  doc.text(`Issued: ${today}`, W - 40, 52, { align: "right" });
  doc.text(`Due: ${due}`, W - 40, 66, { align: "right" });

  // Notice
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Usage limit exceeded — system access blocked", 40, 120);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "To restore access, contact your service provider to upgrade infrastructure quotas.",
    40,
    138
  );

  // Brand-coloured line items
  const items = [
    { name: "Vercel — Frontend hosting & bandwidth", amount: s.billing_vercel_usd, color: [0, 0, 0] },
    { name: "Render — Backend server compute", amount: s.billing_render_usd, color: [70, 229, 153] },
    { name: "Resend — Transactional email delivery", amount: s.billing_resend_usd, color: [99, 102, 241] },
    { name: "Supabase — Database & auth (renewal)", amount: s.billing_supabase_usd, color: [62, 207, 142] },
  ];

  let y = 180;
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y - 18, W - 80, 24, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SERVICE", 50, y - 2);
  doc.text("AMOUNT", W - 50, y - 2, { align: "right" });
  y += 16;

  doc.setFont("helvetica", "normal");
  items.forEach((it) => {
    doc.setFillColor(it.color[0], it.color[1], it.color[2]);
    doc.rect(40, y - 10, 4, 16, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(it.name, 56, y);
    doc.text(fmt(it.amount), W - 50, y, { align: "right" });
    y += 26;
  });

  // Total
  doc.setDrawColor(200, 200, 200);
  doc.line(40, y, W - 40, y);
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(202, 138, 4);
  doc.text("TOTAL DUE", 40, y);
  doc.text(fmt(s.billing_total_usd), W - 40, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Justice Ultimate Automobiles • Westlands, Nairobi • support@justiceultimateautomobiles.com",
    W / 2,
    800,
    { align: "center" }
  );
  doc.text(
    "This invoice covers external service infrastructure required to operate the system.",
    W / 2,
    814,
    { align: "center" }
  );

  doc.save(`${invoiceNo}.pdf`);
};

const Countdown = ({ until }: { until: string }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, new Date(until).getTime() - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-w-[64px]">
      <span className="text-2xl font-bold tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/60">{l}</span>
    </div>
  );
  return (
    <div className="flex items-center justify-center gap-2">
      <Cell v={d} l="Days" /><Cell v={h} l="Hours" /><Cell v={m} l="Mins" /><Cell v={sec} l="Secs" />
    </div>
  );
};

const ServiceTile = ({
  name, color, amount, subtitle, onClick,
}: { name: string; color: string; amount: number; subtitle: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden rounded-2xl p-6 text-left border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md hover:border-white/30 hover:-translate-y-1 transition-all shadow-2xl"
  >
    <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
    <div className="flex items-center justify-between mb-3">
      <span className="text-xl font-bold tracking-tight" style={{ color }}>{name}</span>
      <Lock className="h-4 w-4 text-white/40 group-hover:text-white/80 transition" />
    </div>
    <p className="text-xs text-white/60 mb-4">{subtitle}</p>
    <div className="text-3xl font-extrabold text-white tabular-nums">{fmt(amount)}</div>
    <p className="mt-3 text-[11px] uppercase tracking-widest text-white/50">Click to sign in</p>
  </button>
);

const KillSwitchOverlay = () => {
  const [state, setState] = useState<KillSwitchState | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("system_maintenance")
        .select("kill_switch_active,kill_switch_until,kill_switch_activated_at,billing_total_usd,billing_vercel_usd,billing_render_usd,billing_resend_usd,billing_supabase_usd,billing_due_date,message")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mounted && data) setState(data as KillSwitchState);
    };
    load();
    const poll = setInterval(load, 15000);
    channelRef.current = supabase
      .channel("kill-switch-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_maintenance" }, load)
      .subscribe();
    return () => {
      mounted = false;
      clearInterval(poll);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // Auto-disable when countdown elapses (only admin clients will succeed; others fail silently)
  useEffect(() => {
    if (!state?.kill_switch_active || !state.kill_switch_until) return;
    const ms = new Date(state.kill_switch_until).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(async () => {
      await (supabase as any).from("system_maintenance").update({ kill_switch_active: false }).eq("kill_switch_active", true);
    }, ms + 500);
    return () => clearTimeout(t);
  }, [state?.kill_switch_active, state?.kill_switch_until]);

  const path = location.pathname;
  const isAuthPage = path === "/auth" || path === "/reset-password";
  const isAdminPath = path.startsWith("/admin") || path.startsWith("/system-") || path.startsWith("/staff") || path.startsWith("/hr");
  const isAdmin = !!user && role?.role === "admin";

  const visible = useMemo(() => {
    if (!state?.kill_switch_active) return false;
    if (isAuthPage) return false;
    if (isAdmin && isAdminPath) return false;
    return true;
  }, [state, isAuthPage, isAdmin, isAdminPath]);

  if (!visible || !state) return null;

  const goAuth = () => navigate("/auth", { replace: true });

  return (
    <div
      onClick={goAuth}
      className="fixed bottom-4 right-4 z-[9999] w-[min(420px,calc(100vw-2rem))] cursor-pointer rounded-2xl border border-amber-400/40 bg-slate-950/95 backdrop-blur-xl text-white shadow-2xl shadow-amber-500/20 overflow-hidden animate-fade-in"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 to-red-500" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400">Billing Notice</p>
            <h2 className="text-sm font-bold truncate">Usage limit exceeded</h2>
          </div>
          <Lock className="h-4 w-4 text-amber-300/80" />
        </div>

        <p className="text-xs text-white/70 leading-relaxed mb-3">
          Service quotas exceeded. Click anywhere to sign in.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <p className="text-[9px] uppercase text-white/50">Vercel</p>
            <p className="text-xs font-bold tabular-nums">{fmt(state.billing_vercel_usd)}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <p className="text-[9px] uppercase text-white/50">Render</p>
            <p className="text-xs font-bold tabular-nums">{fmt(state.billing_render_usd)}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <p className="text-[9px] uppercase text-white/50">Resend</p>
            <p className="text-xs font-bold tabular-nums">{fmt(state.billing_resend_usd)}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-2">
            <p className="text-[9px] uppercase text-white/50">Supabase</p>
            <p className="text-xs font-bold tabular-nums">{fmt(state.billing_supabase_usd)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] uppercase tracking-wider text-white/60">Total due</span>
          <span className="text-lg font-extrabold text-amber-300 tabular-nums">{fmt(state.billing_total_usd)}</span>
        </div>

        {state.kill_switch_until && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-2">
            <Clock className="h-3 w-3 text-white/60" />
            <Countdown until={state.kill_switch_until} />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); downloadKillSwitchInvoice(state); }}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold h-8 text-xs"
          >
            <Download className="h-3 w-3 mr-1" /> Download PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); goAuth(); }}
            className="border-white/20 text-white hover:bg-white/10 h-8 text-xs"
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KillSwitchOverlay;
