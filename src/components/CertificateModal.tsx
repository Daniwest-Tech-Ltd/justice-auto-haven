import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import certificateImage from "@/assets/company-certificate.png";

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CertificateModal = ({ open, onOpenChange }: CertificateModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
        <div className="relative h-full flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
            <DialogTitle className="text-lg font-semibold">
              Company Certificate of Professional Qualification
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full hover:bg-destructive/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Certificate Image */}
          <div className="flex-1 overflow-auto p-6 bg-secondary/20">
            <div className="max-w-3xl mx-auto">
              <img
                src={certificateImage}
                alt="Justice Ultimate Automobiles - Certificate of Professional Qualification"
                className="w-full h-auto rounded-lg shadow-2xl border-4 border-accent/30"
              />
              
              {/* Certificate Details */}
              <div className="mt-6 glass-strong rounded-xl p-6 space-y-3">
                <h3 className="text-xl font-bold text-foreground">Certificate Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-primary">Certificate No:</span>
                    <p className="text-muted-foreground">ULT-KE-2025-2581</p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Date Issued:</span>
                    <p className="text-muted-foreground">2025-11-21</p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Certified Under:</span>
                    <p className="text-muted-foreground">HARAMBEE - Republic of Kenya</p>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Status:</span>
                    <p className="text-green-600 font-semibold">✓ Verified & Active</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    Justice Ultimate Automobiles has been formally recognized as a Qualified Automotive Industry Partner, 
                    authorized to operate as a professional automotive dealer in Kenya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;
