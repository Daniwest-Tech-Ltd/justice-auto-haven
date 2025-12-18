import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CreditCard, Shield } from "lucide-react";

interface PesapalPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  description?: string;
}

export const PesapalPaymentModal = ({ 
  open, 
  onOpenChange, 
  amount,
  description 
}: PesapalPaymentModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden bg-transparent border-0 max-h-[90vh]">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-secondary/20 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          
          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[85vh]">
            <DialogHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/20">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-bold">Pesapal Payment</DialogTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Secure payment powered by Pesapal
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onOpenChange(false)}
                  className="rounded-full hover:bg-destructive/20 hover:text-destructive h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            {/* Payment Info */}
            {(amount || description) && (
              <div className="mt-3 p-3 rounded-xl bg-accent/30 border border-border/50">
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
                )}
                {amount && (
                  <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                    KES {amount.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Pesapal Iframe Container */}
            <div className="mt-4 rounded-xl overflow-hidden border border-border/50 bg-card/50">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span>256-bit SSL Encrypted Payment</span>
                </div>
              </div>
              
              {/* Pesapal Embed */}
              <div className="p-3 sm:p-4 flex flex-col items-center justify-center space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold">Pay with Pesapal</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                    Click below to securely pay using M-Pesa, Visa, Mastercard, or Bank Transfer
                  </p>
                </div>
                
                {/* Pesapal Button Iframe */}
                <div className="p-3 sm:p-4 rounded-xl bg-background/80 border border-border shadow-lg w-full">
                  <iframe 
                    width="100%" 
                    height="200" 
                    src="https://store.pesapal.com/embed-code?pageUrl=https://store.pesapal.com/justiceultimateautomobile" 
                    frameBorder="0" 
                    allowFullScreen
                    className="rounded-lg w-full"
                    title="Pesapal Payment"
                  />
                </div>

                {/* Payment Methods */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-border/50 w-full">
                  <div className="text-xs text-muted-foreground">Accepted:</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">M-Pesa</div>
                    <div className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">Visa</div>
                    <div className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 text-xs font-medium">Mastercard</div>
                    <div className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 text-xs font-medium">Bank</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <p>© Justice Ultimate Automobiles</p>
              <p className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Secure Payment
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
