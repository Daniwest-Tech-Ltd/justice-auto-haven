import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SalesAgreementWizard } from "./SalesAgreementWizard";
import {
  downloadSalesAgreementPdf,
  downloadBlankPdfTemplate,
  downloadWordTemplate,
  type SalesAgreementData,
} from "@/lib/salesAgreementPdf";
import { Plus, FileDown, FileText, Pencil, Trash2, Loader2, FileSignature } from "lucide-react";

export const SalesAgreementsTab = () => {
  const { toast } = useToast();
  const [agreements, setAgreements] = useState<SalesAgreementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SalesAgreementData | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_agreements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAgreements((data as any) ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleDownload = async (a: SalesAgreementData) => {
    setBusyId(a.id!);
    try {
      await downloadSalesAgreementPdf(a);
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (a: SalesAgreementData) => {
    if (!confirm(`Delete agreement ${a.agreement_number}?`)) return;
    setBusyId(a.id!);
    const { error } = await supabase.from("sales_agreements").delete().eq("id", a.id!);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Agreement removed." });
      fetchAgreements();
    }
    setBusyId(null);
  };

  if (editing) {
    return (
      <SalesAgreementWizard
        initial={editing === "new" ? null : editing}
        onClose={(saved) => {
          setEditing(null);
          if (saved) fetchAgreements();
          else fetchAgreements();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FileSignature className="h-7 w-7 text-primary" />
            Sales Agreements
          </h2>
          <p className="text-sm text-muted-foreground">
            Create official motor vehicle sale agreements with digital signatures and the company stamp.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => downloadBlankPdfTemplate()}>
            <FileDown className="h-4 w-4 mr-1" /> Blank PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadWordTemplate()}>
            <FileText className="h-4 w-4 mr-1" /> Word Template
          </Button>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4 mr-1" /> New Agreement
          </Button>
        </div>
      </div>

      <Card className="glass-strong">
        <CardContent className="p-0 sm:p-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                      Loading agreements...
                    </TableCell>
                  </TableRow>
                ) : agreements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No sales agreements yet. Click "New Agreement" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  agreements.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {a.agreement_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.agreement_date
                          ? new Date(a.agreement_date).toLocaleDateString("en-GB")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{a.seller_name || "—"}</TableCell>
                      <TableCell className="text-sm">{a.buyer_name || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {[a.vehicle_year, a.vehicle_make, a.vehicle_model].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {a.purchase_price != null ? `KSh ${Number(a.purchase_price).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            a.status === "final"
                              ? "bg-green-500/15 text-green-500 border-green-500/30"
                              : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                          }
                        >
                          {a.status === "final" ? "Final" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => setEditing(a)}
                            disabled={busyId === a.id}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download PDF"
                            onClick={() => handleDownload(a)}
                            disabled={busyId === a.id}
                          >
                            {busyId === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-destructive"
                            onClick={() => handleDelete(a)}
                            disabled={busyId === a.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
