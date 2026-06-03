import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Lock, Clock } from "lucide-react";
import jsPDF from "jspdf";
import vercelLogo from "@/assets/logos/vercel.png";
import renderLogo from "@/assets/logos/render.png";
import resendLogo from "@/assets/logos/resend.png";
import supabaseLogo from "@/assets/logos/supabase.png";

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
  // Per-service detail (added)
  billing_vercel_exceeded_date?: string | null;
  billing_vercel_due_date?: string | null;
  billing_vercel_upgrade_usd?: number | null;
  billing_vercel_past_due?: boolean | null;
  billing_vercel_note?: string | null;
  billing_render_exceeded_date?: string | null;
  billing_render_due_date?: string | null;
  billing_render_upgrade_usd?: number | null;
  billing_render_past_due?: boolean | null;
  billing_render_note?: string | null;
  billing_resend_exceeded_date?: string | null;
  billing_resend_due_date?: string | null;
  billing_resend_upgrade_usd?: number | null;
  billing_resend_past_due?: boolean | null;
  billing_resend_note?: string | null;
  billing_supabase_exceeded_date?: string | null;
  billing_supabase_due_date?: string | null;
  billing_supabase_upgrade_usd?: number | null;
  billing_supabase_past_due?: boolean | null;
  billing_supabase_note?: string | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }) : "—";

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

  const today = new Date().toDateString();
  const due = new Date(state.billing_due_date).toDateString();
  const invoiceNo = `JUA-SVC-${(state.kill_switch_activated_at || today).toString().slice(-8).replace(/\D/g, "") || "00000001"}`;

  const lineItems = [
    { name: "Vercel", desc: "Frontend hosting & bandwidth", amount: state.billing_vercel_usd },
    { name: "Render", desc: "Backend server compute", amount: state.billing_render_usd },
    { name: "Resend", desc: "Transactional email delivery", amount: state.billing_resend_usd },
    { name: "Supabase", desc: "Database & auth (Pro renewal)", amount: state.billing_supabase_usd },
  ];

  return (
    <div
      onClick={goAuth}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[9999] overflow-y-auto cursor-pointer bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-emerald-50"
    >
      {/* Money guilloché pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(16,185,129,.6) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(16,185,129,.4) 0 1px, transparent 1px 14px)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,.6)_100%)]" />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-950 rounded-2xl shadow-[0_30px_90px_-20px_rgba(16,185,129,0.5)] overflow-hidden border-4 border-double border-emerald-700">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-emerald-50 px-6 sm:px-10 py-6 border-b-4 border-amber-400">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent 0 18px, rgba(255,255,255,.25) 18px 19px)",
              }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300 font-semibold">
                  Service Infrastructure Invoice
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
                  JUSTICE ULTIMATE AUTOMOBILES
                </h1>
                <p className="text-xs text-emerald-100/80 mt-1">
                  Westlands, Nairobi • support@justiceultimateautomobiles.com
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 border border-red-300/40 text-red-100 text-[10px] uppercase tracking-widest font-bold">
                  <AlertTriangle className="h-3 w-3" /> Past Due
                </div>
                <p className="text-[10px] mt-2 text-emerald-100/70">Invoice #</p>
                <p className="text-sm font-mono font-bold">{invoiceNo}</p>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-6 sm:px-10 py-5 border-b border-emerald-200 bg-emerald-50/50 text-xs">
            <div>
              <p className="uppercase tracking-wider text-emerald-700/70 font-semibold">Issued</p>
              <p className="font-bold text-sm">{today}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-emerald-700/70 font-semibold">Due Date</p>
              <p className="font-bold text-sm text-red-700">{due}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="uppercase tracking-wider text-emerald-700/70 font-semibold">Status</p>
              <p className="font-bold text-sm text-red-700">Usage Limit Exceeded</p>
            </div>
          </div>

          {/* Line items */}
          <div className="px-6 sm:px-10 py-6">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-widest text-emerald-700/70 font-semibold pb-2 border-b-2 border-emerald-800">
              <div className="col-span-7">Service</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-3 text-right">Amount (USD)</div>
            </div>

            {lineItems.map((it, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 py-3 border-b border-dashed border-emerald-300 items-center"
              >
                <div className="col-span-7">
                  <p className="font-bold text-sm">{it.name}</p>
                  <p className="text-xs text-emerald-800/70">{it.desc}</p>
                </div>
                <div className="col-span-2 text-center text-sm font-mono">1</div>
                <div className="col-span-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                  {fmt(it.amount)}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-4 ml-auto w-full sm:w-1/2 space-y-1 text-sm">
              <div className="flex justify-between text-emerald-800/80">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{fmt(state.billing_total_usd)}</span>
              </div>
              <div className="flex justify-between text-emerald-800/80">
                <span>Tax</span>
                <span className="font-mono tabular-nums">$0.00</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-3 border-t-4 border-double border-emerald-800 bg-emerald-100 -mx-2 px-2 rounded">
                <span className="font-extrabold uppercase tracking-wider text-emerald-900">
                  Total Due
                </span>
                <span className="font-mono font-extrabold text-2xl text-emerald-700 tabular-nums">
                  {fmt(state.billing_total_usd)}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          {state.kill_switch_until && (
            <div className="px-6 sm:px-10 pb-4">
              <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 py-4">
                <div className="flex items-center gap-2 text-emerald-800/70 text-[10px] uppercase tracking-widest font-semibold">
                  <Clock className="h-3 w-3" /> Grace period remaining
                </div>
                <div className="text-emerald-900">
                  <Countdown until={state.kill_switch_until} />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 sm:px-10 py-5 bg-emerald-900 text-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-emerald-100/80 flex items-center gap-2">
              <Lock className="h-3 w-3" /> Click anywhere on this page to sign in
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={(e) => { e.stopPropagation(); downloadKillSwitchInvoice(state); }}
                className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold"
              >
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); goAuth(); }}
                variant="outline"
                className="border-emerald-300/40 bg-transparent text-emerald-50 hover:bg-emerald-800"
              >
                Sign in
              </Button>
            </div>
          </div>

          {/* Footer strip */}
          <div className="bg-emerald-950 text-emerald-200/60 text-[10px] text-center py-2 tracking-widest uppercase">
            Justice Ultimate Automobiles • Service Infrastructure Billing • Confidential
          </div>
        </div>
      </div>
    </div>
  );
};

export default KillSwitchOverlay;
