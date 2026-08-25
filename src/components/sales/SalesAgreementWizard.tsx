import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SignaturePad } from "@/components/sales/SignaturePad";
import {
  buildSalesAgreementPdf,
  type SalesAgreementData,
} from "@/lib/salesAgreementPdf";
import {
  User,
  UserCheck,
  Car,
  Banknote,
  ShieldCheck,
  Package,
  FileText,
  ScrollText,
  PenLine,
  ArrowLeft,
  ArrowRight,
  Save,
  FileDown,
  Loader2,
  X,
} from "lucide-react";

const ACCESSORIES = [
  "Spare Wheel",
  "Jack & Wheel Spanner",
  "Tool Kit",
  "Radio / Infotainment",
  "Floor Mats",
  "Seat Covers",
  "Fire Extinguisher",
  "First Aid Kit",
  "Warning Triangles",
  "Spare Key",
];

const DOCUMENTS = [
  "Original Logbook",
  "NTSA Transfer Form",
  "KRA PIN Copy",
  "National ID Copy",
  "Import Entry Documents",
  "Inspection Report",
  "Service History",
  "Sale Invoice",
];

const STEPS = [
  { title: "Seller", icon: User },
  { title: "Buyer", icon: UserCheck },
  { title: "Vehicle", icon: Car },
  { title: "Sale Terms", icon: Banknote },
  { title: "Condition", icon: ShieldCheck },
  { title: "Accessories", icon: Package },
  { title: "Documents", icon: FileText },
  { title: "T & C", icon: ScrollText },
  { title: "Signatures", icon: PenLine },
];

interface WizardProps {
  initial?: SalesAgreementData | null;
  onClose: (saved: boolean) => void;
}

export const SalesAgreementWizard = ({ initial, onClose }: WizardProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [data, setData] = useState<SalesAgreementData>({
    agreement_date: new Date().toISOString().slice(0, 10),
    accessories: [],
    documents: [],
    ...(initial ?? {}),
  });

  const set = (key: keyof SalesAgreementData, val: any) =>
    setData((d) => ({ ...d, [key]: val }));

  const setNum = (key: keyof SalesAgreementData, val: string) => {
    const n = val === "" ? null : Number(val);
    setData((d) => {
      const next: SalesAgreementData = { ...d, [key]: n };
      // auto-compute balance
      if (key === "purchase_price" || key === "deposit_paid") {
        const price = key === "purchase_price" ? n : d.purchase_price;
        const dep = key === "deposit_paid" ? n : d.deposit_paid;
        if (price != null && dep != null) next.balance_payable = price - dep;
      }
      return next;
    });
  };

  const toggleList = (key: "accessories" | "documents", item: string) => {
    setData((d) => {
      const list = Array.isArray(d[key]) ? [...(d[key] as string[])] : [];
      const idx = list.indexOf(item);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(item);
      return { ...d, [key]: list };
    });
  };

  const save = async (status: "draft" | "final") => {
    const { data: sessionData } = await supabase.auth.getUser();
    const payload: Record<string, any> = {
      ...data,
      status,
      updated_at: new Date().toISOString(),
    };
    delete payload.created_at;

    if (!payload.id) {
      payload.created_by = sessionData.user?.id ?? null;
      if (!payload.agreement_number) {
        payload.agreement_number = `JUA-AGR-${Date.now().toString().slice(-6)}`;
      }
    }

    if (payload.id) {
      const { error } = await supabase
        .from("sales_agreements")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    }
    const { data: inserted, error } = await supabase
      .from("sales_agreements")
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    setData((d) => ({ ...d, id: inserted.id, agreement_number: inserted.agreement_number }));
    return inserted;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await save("draft");
      toast({ title: "Saved", description: "Agreement saved as draft." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const saved = await save("final");
      const finalData = { ...data, ...saved };

      // Generate PDF
      const blob = await buildSalesAgreementPdf(finalData as SalesAgreementData);

      // Upload to Supabase storage (private bucket)
      const path = `${finalData.agreement_number ?? finalData.id}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("sales-agreements")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (upErr) {
        console.warn("Storage upload failed:", upErr.message);
      } else {
        await supabase
          .from("sales_agreements")
          .update({ pdf_path: path })
          .eq("id", finalData.id);
      }

      // Auto-download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Agreement_${finalData.agreement_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);

      toast({ title: "Agreement finalized", description: "PDF saved and downloaded successfully." });
      onClose(true);
    } catch (e: any) {
      toast({ title: "Finalize failed", description: e.message, variant: "destructive" });
    } finally {
      setFinalizing(false);
    }
  };

  const field = (
    label: string,
    key: keyof SalesAgreementData,
    opts?: { type?: string; placeholder?: string; half?: boolean }
  ) => (
    <div className={opts?.half ? "" : "sm:col-span-1"}>
      <Label className="text-sm">{label}</Label>
      <Input
        type={opts?.type ?? "text"}
        placeholder={opts?.placeholder}
        value={(data[key] as any) ?? ""}
        onChange={(e) =>
          opts?.type === "number" ? setNum(key, e.target.value) : set(key, e.target.value)
        }
        className="mt-1"
      />
    </div>
  );

  return (
    <Card className="glass-strong">
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {initial?.id ? "Edit Sales Agreement" : "New Sales Agreement"}
            </h2>
            <p className="text-sm text-muted-foreground">
              All fields are optional — save at any step and continue later.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onClose(false)}>
            <X className="h-4 w-4 mr-1" /> Close
          </Button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.title}
                type="button"
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {i + 1}. {s.title}
              </button>
            );
          })}
        </div>

        {/* STEP 1: Seller */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Seller Full Name", "seller_name")}
            {field("ID / Passport No.", "seller_id_no")}
            {field("Address", "seller_address")}
            {field("Phone", "seller_phone")}
            {field("KRA PIN", "seller_kra_pin")}
          </div>
        )}

        {/* STEP 2: Buyer */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Buyer Full Name", "buyer_name")}
            {field("ID / Passport No.", "buyer_id_no")}
            {field("Address", "buyer_address")}
            {field("Phone", "buyer_phone")}
            {field("KRA PIN", "buyer_kra_pin")}
          </div>
        )}

        {/* STEP 3: Vehicle */}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Make", "vehicle_make", { placeholder: "e.g. Toyota" })}
            {field("Model", "vehicle_model", { placeholder: "e.g. Land Cruiser" })}
            {field("Year", "vehicle_year", { type: "number" })}
            {field("Registration No.", "vehicle_registration")}
            {field("VIN / Chassis No.", "vehicle_vin")}
            {field("Engine No.", "vehicle_engine_no")}
            {field("Body Type", "vehicle_body", { placeholder: "e.g. SUV" })}
            {field("Transmission", "vehicle_transmission", { placeholder: "e.g. Automatic" })}
            {field("Fuel", "vehicle_fuel", { placeholder: "e.g. Diesel" })}
            {field("Colour", "vehicle_color")}
            {field("Seats", "vehicle_seats", { type: "number" })}
            <div>
              <Label className="text-sm">Condition</Label>
              <Select
                value={data.vehicle_condition ?? ""}
                onValueChange={(val) => set("vehicle_condition", val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {["Excellent", "Very Good", "Good", "Fair", "Sold As-Is"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* STEP 4: Sale Terms */}
        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Purchase Price (KSh)", "purchase_price", { type: "number" })}
            {field("Deposit Paid (KSh)", "deposit_paid", { type: "number" })}
            {field("Balance Payable (KSh)", "balance_payable", { type: "number" })}
            <div>
              <Label className="text-sm">Payment Method</Label>
              <Select
                value={data.payment_method ?? ""}
                onValueChange={(val) => set("payment_method", val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {["Cash", "Bank Transfer", "M-Pesa", "Cheque", "Asset Finance", "Instalments"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Payment Terms</Label>
              <Select
                value={data.payment_terms ?? ""}
                onValueChange={(val) => set("payment_terms", val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  {["Full Payment", "Deposit + Balance", "Monthly Instalments"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("No. of Instalments", "instalment_count", { type: "number" })}
            {field("Monthly Instalment Amount (KSh)", "instalment_amount", { type: "number" })}
          </div>
        )}

        {/* STEP 5: Condition & Disclosure */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <p className="text-sm">
                Declared condition:{" "}
                <span className="font-semibold">{data.vehicle_condition || "Not specified"}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The Buyer acknowledges that the vehicle has been inspected and is sold as viewed
                and described in this Agreement.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="condition_accepted"
                checked={!!data.condition_accepted}
                onCheckedChange={(c) => set("condition_accepted", c === true)}
              />
              <Label htmlFor="condition_accepted" className="cursor-pointer">
                I accept the Vehicle Condition & Disclosure statement
              </Label>
            </div>
          </div>
        )}

        {/* STEP 6: Accessories */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACCESSORIES.map((a) => (
                <div key={a} className="flex items-center gap-2">
                  <Checkbox
                    id={`acc-${a}`}
                    checked={(data.accessories ?? []).includes(a)}
                    onCheckedChange={() => toggleList("accessories", a)}
                  />
                  <Label htmlFor={`acc-${a}`} className="text-sm cursor-pointer">{a}</Label>
                </div>
              ))}
            </div>
            <div>
              <Label className="text-sm">Other included accessories</Label>
              <Textarea
                value={data.other_accessories ?? ""}
                onChange={(e) => set("other_accessories", e.target.value)}
                placeholder="Any other accessories included in the sale..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* STEP 7: Documents */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DOCUMENTS.map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <Checkbox
                    id={`doc-${d}`}
                    checked={(data.documents ?? []).includes(d)}
                    onCheckedChange={() => toggleList("documents", d)}
                  />
                  <Label htmlFor={`doc-${d}`} className="text-sm cursor-pointer">{d}</Label>
                </div>
              ))}
            </div>
            <div>
              <Label className="text-sm">Other documents to be transferred</Label>
              <Textarea
                value={data.other_documents ?? ""}
                onChange={(e) => set("other_documents", e.target.value)}
                placeholder="Any other documents..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* STEP 8: Terms */}
        {step === 7 && (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>The Seller warrants legal ownership of the vehicle, free from encumbrances.</li>
              <li>The Buyer confirms inspection and accepts the vehicle as viewed.</li>
              <li>Ownership passes to the Buyer upon receipt of full payment.</li>
              <li>NTSA transfer documents shall be delivered within fourteen (14) days of full payment.</li>
              <li>Deposits are non-refundable except where the Seller fails to deliver.</li>
              <li>This Agreement is governed by the laws of the Republic of Kenya.</li>
            </ol>
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="terms_accepted"
                checked={!!data.terms_accepted}
                onCheckedChange={(c) => set("terms_accepted", c === true)}
              />
              <Label htmlFor="terms_accepted" className="cursor-pointer">
                Both parties accept the Additional Terms & Conditions
              </Label>
            </div>
          </div>
        )}

        {/* STEP 9: Signatures */}
        {step === 8 && (
          <div className="space-y-6">
            <SignaturePad
              label="Seller Signature"
              value={data.seller_signature}
              onChange={(sig) => set("seller_signature", sig)}
            />
            <SignaturePad
              label="Buyer Signature"
              value={data.buyer_signature}
              onChange={(sig) => set("buyer_signature", sig)}
            />
            <div className="max-w-sm">
              {field("Witness Name", "witness_name")}
            </div>
            <SignaturePad
              label="Witness Signature"
              value={data.witness_signature}
              onChange={(sig) => set("witness_signature", sig)}
            />
          </div>
        )}

        {/* Navigation + Save */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 8 && (
              <Button type="button" onClick={() => setStep((s) => Math.min(8, s + 1))}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={saving || finalizing}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
            {step === 8 && (
              <Button type="button" onClick={handleFinalize} disabled={saving || finalizing}>
                {finalizing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
                Finalize, Save & Download PDF
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
