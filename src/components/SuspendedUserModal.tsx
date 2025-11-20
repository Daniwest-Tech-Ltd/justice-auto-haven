import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, MessageCircle, Home, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface SuspendedUserModalProps {
  isOpen: boolean;
  reason?: string;
  suspendedUntil?: string;
  onSuccess: () => void;
}

export const SuspendedUserModal = ({ isOpen, reason, suspendedUntil, onSuccess }: SuspendedUserModalProps) => {
  const [activationCode, setActivationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (!suspendedUntil) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const until = new Date(suspendedUntil).getTime();
      const distance = until - now;

      if (distance < 0) {
        setTimeRemaining("Suspension expired - please try logging in again");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [suspendedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      toast.error("Please enter the activation code");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("activation_code")
        .eq("user_id", user.id)
        .single();

      if (profile?.activation_code !== activationCode.trim()) {
        toast.error("Invalid activation code");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended: false,
          activation_code: null,
          suspended_at: null,
          suspended_reason: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Account reactivated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Activation error:", error);
      toast.error("Failed to activate account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            <DialogTitle>Account Suspended</DialogTitle>
          </div>
          <DialogDescription>
            Your account has been temporarily suspended due to multiple failed login attempts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {reason && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{reason}</AlertDescription>
            </Alert>
          )}

          {timeRemaining && (
            <div className="bg-muted p-5 rounded-lg text-center border">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Time remaining:</p>
              <p className="text-3xl font-bold text-foreground tracking-wide">{timeRemaining}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can wait for the suspension to expire or enter an activation code from an administrator to reactivate your account immediately.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="activationCode" className="text-sm font-medium mb-2 block">
                  Activation Code (Optional)
                </label>
                <Input
                  id="activationCode"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="Enter activation code from admin"
                  className="font-mono"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !activationCode.trim()}>
                {isSubmitting ? "Activating..." : "Activate Account Now"}
              </Button>
            </form>
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t">
            <p className="text-sm font-medium text-foreground">Need assistance?</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/reset-password" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Reset
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/contact" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
