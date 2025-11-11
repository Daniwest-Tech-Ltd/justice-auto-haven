import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface SuspendedUserModalProps {
  isOpen: boolean;
  reason?: string;
  onSuccess: () => void;
}

export const SuspendedUserModal = ({ isOpen, reason, onSuccess }: SuspendedUserModalProps) => {
  const [activationCode, setActivationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            <DialogTitle>Account Suspended</DialogTitle>
          </div>
          <DialogDescription>
            Your account has been temporarily suspended. Please enter the activation code provided by the administrator to reactivate your account.
          </DialogDescription>
        </DialogHeader>

        {reason && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Reason:</strong> {reason}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="activationCode" className="text-sm font-medium mb-2 block">
              Activation Code
            </label>
            <Input
              id="activationCode"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              placeholder="Enter the activation code"
              className="font-mono"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Activating..." : "Activate Account"}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>
              Don't have a code?{" "}
              <a href="/contact" className="text-primary hover:underline">
                Contact Support
              </a>
            </span>
          </div>
          <div className="text-center">
            <span>Or{" "}</span>
            <Link to="/reset-password" className="text-primary hover:underline font-medium">
              reset your password
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
