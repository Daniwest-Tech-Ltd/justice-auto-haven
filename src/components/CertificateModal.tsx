import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, FileText, ChevronLeft, ChevronRight, Building2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

import { supabase } from "@/integrations/supabase/client";
import certificateImageFallback from "@/assets/company-certificate.png";

interface CompanyDocument {
  id: string;
  document_type: string;
  title: string;
  description: string | null;
  file_url: string;
  certificate_number: string | null;
  issue_date: string | null;
  issuing_authority: string | null;
  status: string;
  is_featured: boolean;
}

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CertificateModal = ({ open, onOpenChange }: CertificateModalProps) => {
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [activeTab, setActiveTab] = useState<"certificate" | "profile">("certificate");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("company_documents")
        .select("*")
        .eq("status", "active")
        .order("display_order", { ascending: true });
      setDocs((data as CompanyDocument[]) || []);
      setLoading(false);
    })();
  }, [open]);

  const filtered = docs.filter((d) =>
    activeTab === "certificate"
      ? d.document_type !== "profile"
      : d.document_type === "profile"
  );

  const current = filtered[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: 0 });
  }, [open, currentIndex]);

  const renderFile = (url: string, alt: string) => {
    if (url.match(/\.pdf$/i)) {
      return <iframe src={url} className="w-full h-[60vh] rounded-lg border border-border" title={alt} />;
    }
    return <img src={url} alt={alt} className="block w-full h-auto rounded-lg shadow-2xl border-4 border-accent/30" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
        <div className="relative h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
            <DialogTitle className="text-lg font-semibold">Company Documents</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-destructive/10">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-3 border-b border-border bg-background/95 backdrop-blur-sm">
            <Button
              variant={activeTab === "certificate" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("certificate")}
              className="gap-2"
            >
              <Award className="h-4 w-4" /> Certificates
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("profile")}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" /> Company Profile
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-secondary/20 cert-scroll">
            <div className="p-4 md:p-6 pb-24">
              <div className="max-w-4xl mx-auto">
              {loading ? (
                <div className="text-center text-muted-foreground py-12">Loading documents…</div>
              ) : filtered.length === 0 ? (
                <div className="glass-strong rounded-xl p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {activeTab === "certificate" ? "No certificates available." : "No company profile uploaded yet."}
                  </p>
                  {activeTab === "certificate" && (
                    <img
                      src={certificateImageFallback}
                      alt="Justice Ultimate Automobiles - Certificate"
                      className="block w-full h-auto rounded-lg shadow-2xl border-4 border-accent/30 mt-6"
                    />
                  )}
                </div>
              ) : (
                <>
                  {filtered.length > 1 && (
                    <div className="flex items-center justify-between mb-4 glass rounded-lg px-4 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentIndex + 1} of {filtered.length}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCurrentIndex((i) => Math.min(filtered.length - 1, i + 1))}
                        disabled={currentIndex === filtered.length - 1}
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {current && (
                    <>
                      {current.file_url.startsWith("/src/assets/")
                        ? <img src={certificateImageFallback} alt={current.title} className="block w-full h-auto rounded-lg shadow-2xl border-4 border-accent/30" />
                        : renderFile(current.file_url, current.title)}

                      <div className="mt-6 glass-strong rounded-xl p-6 space-y-3">
                        <h3 className="text-xl font-bold text-foreground">{current.title}</h3>
                        {current.description && <p className="text-sm text-muted-foreground">{current.description}</p>}
                        <div className="grid md:grid-cols-2 gap-4 text-sm pt-2">
                          {current.certificate_number && (
                            <div>
                              <span className="font-semibold text-primary">Certificate No:</span>
                              <p className="text-muted-foreground">{current.certificate_number}</p>
                            </div>
                          )}
                          {current.issue_date && (
                            <div>
                              <span className="font-semibold text-primary">Date Issued:</span>
                              <p className="text-muted-foreground">{current.issue_date}</p>
                            </div>
                          )}
                          {current.issuing_authority && (
                            <div>
                              <span className="font-semibold text-primary">Issued By:</span>
                              <p className="text-muted-foreground">{current.issuing_authority}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-primary">Status:</span>
                            <p className="text-green-600 font-semibold">✓ Verified & Active</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute bottom-4 right-5 z-20 border border-primary/30 shadow-lg"
              onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
            >
              Scroll down
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;
