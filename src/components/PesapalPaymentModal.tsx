import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CreditCard, Shield, CheckCircle, Loader2, AlertCircle, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PesapalPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  description?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onPaymentComplete?: (paymentData: PaymentData) => void;
}

interface PaymentData {
  transactionDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  confirmationCode: string;
  merchantReference: string;
  orderTrackingId: string;
}

type PaymentStatus = 'idle' | 'initiating' | 'processing' | 'completed' | 'failed';

const PESAPAL_IPN_ID = '7dda9c82-21ba-4ded-984c-daeb20fa7259';

export const PesapalPaymentModal = ({ 
  open, 
  onOpenChange, 
  amount = 0,
  description = '',
  orderId,
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  onPaymentComplete
}: PesapalPaymentModalProps) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const paymentWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus('idle');
      setPaymentData(null);
      setError(null);
      setPaymentId(null);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [open]);

  // Poll for payment status
  const pollPaymentStatus = useCallback(async (paymentRecordId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentRecordId)
        .single();

      if (error) throw error;

      if (data.status === 'completed') {
        // Payment completed!
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        // Close the popup window
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
          paymentWindowRef.current.close();
        }

        const completedData: PaymentData = {
          transactionDate: new Date(data.completed_at || data.updated_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          amount: data.amount,
          currency: data.currency,
          paymentMethod: data.payment_method || 'Pesapal',
          confirmationCode: (data.metadata as Record<string, unknown>)?.confirmation_code as string || data.pesapal_order_tracking_id || 'N/A',
          merchantReference: data.pesapal_merchant_reference || '',
          orderTrackingId: data.pesapal_order_tracking_id || ''
        };

        setPaymentData(completedData);
        setStatus('completed');
        onPaymentComplete?.(completedData);
        toast.success('Payment completed successfully!');
      } else if (data.status === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setError('Payment failed. Please try again.');
        setStatus('failed');
      }
    } catch (err) {
      console.error('Error polling payment status:', err);
    }
  }, [onPaymentComplete]);

  // Check if popup was closed manually
  useEffect(() => {
    if (status === 'processing' && paymentWindowRef.current) {
      const checkPopup = setInterval(() => {
        if (paymentWindowRef.current?.closed) {
          clearInterval(checkPopup);
          // Don't immediately fail - the IPN might still come through
          // Just continue polling for a bit longer
        }
      }, 1000);

      return () => clearInterval(checkPopup);
    }
  }, [status]);

  const initiatePayment = async () => {
    setStatus('initiating');
    setError(null);

    try {
      const response = await supabase.functions.invoke('pesapal-initiate', {
        body: {
          order_id: orderId,
          amount,
          currency: 'KES',
          description,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          callback_url: `${window.location.origin}/payment-callback`,
          ipn_id: PESAPAL_IPN_ID
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to initiate payment');
      }

      const data = response.data;
      
      if (!data.redirect_url) {
        throw new Error('No redirect URL received from Pesapal');
      }

      setPaymentId(data.payment_id);
      
      // Open Pesapal in popup window
      const popup = window.open(
        data.redirect_url,
        'PesapalPayment',
        'width=550,height=700,scrollbars=yes,resizable=yes,left=200,top=100'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      paymentWindowRef.current = popup;
      setStatus('processing');

      // Start polling for payment status
      pollingIntervalRef.current = setInterval(() => {
        if (data.payment_id) {
          pollPaymentStatus(data.payment_id);
        }
      }, 3000);

    } catch (err: unknown) {
      console.error('Payment initiation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setStatus('failed');
    }
  };

  const handleClose = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
      paymentWindowRef.current.close();
    }
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="space-y-4">
            {/* Payment Info */}
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              <p className="text-2xl font-bold text-primary mt-1">
                KES {amount.toLocaleString()}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="p-4 rounded-xl bg-card/50 border border-border/50">
              <h4 className="text-sm font-medium mb-3">Available Payment Methods</h4>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 text-sm font-medium">M-Pesa</div>
                <div className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-600 text-sm font-medium">Visa</div>
                <div className="px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-600 text-sm font-medium">Mastercard</div>
                <div className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-600 text-sm font-medium">Bank Transfer</div>
              </div>
            </div>

            <Button 
              onClick={initiatePayment} 
              className="w-full h-12 text-base font-semibold"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Now
            </Button>
          </div>
        );

      case 'initiating':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-lg font-medium">Initiating payment...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Processing Payment</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Complete your payment in the popup window. This page will update automatically.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
              <p className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Don't close this modal until payment is complete
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500" />
              <span>256-bit SSL Encrypted</span>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-6">
            {/* Success Header with Steps */}
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</div>
                <span className="text-xs text-muted-foreground hidden sm:inline">Enter Details</span>
              </div>
              <div className="w-8 h-0.5 bg-primary" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</div>
                <span className="text-xs text-muted-foreground hidden sm:inline">Make Payment</span>
              </div>
              <div className="w-8 h-0.5 bg-primary" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">3</div>
                <span className="text-xs text-muted-foreground hidden sm:inline">Confirmation</span>
              </div>
            </div>

            {/* Payment Completed Card */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <div>
                  <h3 className="text-xl font-bold">Payment Completed</h3>
                  <p className="text-sm text-muted-foreground">Thank you for your purchase.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Transaction Date:</span>
                  <span className="font-medium">{paymentData?.transactionDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-primary">
                    {paymentData?.currency} {paymentData?.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">{paymentData?.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Confirmation Code:</span>
                  <span className="font-mono font-bold text-primary">{paymentData?.confirmationCode}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => toast.info('Receipt download feature coming soon')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button 
                onClick={() => {
                  setStatus('idle');
                  setPaymentData(null);
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Make Another Payment
              </Button>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Payment Failed</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {error || 'Something went wrong. Please try again.'}
              </p>
            </div>

            <Button onClick={() => setStatus('idle')} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden bg-transparent border-0 max-h-[90vh]">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-secondary/20 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          
          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[85vh]">
            <DialogHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">
                      {status === 'completed' ? 'Payment Successful' : 'Pesapal Payment'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {status === 'completed' 
                        ? 'Your transaction is complete' 
                        : 'Secure payment powered by Pesapal'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClose}
                  className="rounded-full hover:bg-destructive/20 hover:text-destructive h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="mt-4">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <p>© Justice Ultimate Automobiles</p>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-green-500" />
                <span>PCI DSS Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
