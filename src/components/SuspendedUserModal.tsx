import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, MessageCircle, AlertTriangle, Mail, Phone, KeyRound, Loader2, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuspendedUserModalProps {
  isOpen: boolean;
  reason?: string;
  suspendedUntil?: string;
  onSuccess: () => void;
  accountStatus?: 'suspended' | 'blocked' | 'deleted' | 'locked';
  userId?: string;
  requiresOtp?: boolean;
}

export const SuspendedUserModal = ({ 
  isOpen, 
  reason, 
  suspendedUntil, 
  onSuccess,
  accountStatus = 'suspended',
  userId,
  requiresOtp = false
}: SuspendedUserModalProps) => {
  const [activationCode, setActivationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [messageToAdmin, setMessageToAdmin] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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

  const handleVerifyOtp = async () => {
    if (!userId || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.rpc('verify_reactivation_otp', {
        _user_id: userId,
        _otp: otp
      });

      if (error) throw error;

      if (data) {
        toast.success("Account Reactivated! You can now login.");
        onSuccess();
      } else {
        toast.error("Invalid OTP. The code is invalid or has expired.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

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
        .select("activation_code, account_status, full_name, email")
        .eq("user_id", user.id)
        .single();

      if (profile?.activation_code !== activationCode.trim()) {
        toast.error("Invalid activation code. Please check and try again.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended: false,
          account_status: "active",
          activation_code: null,
          suspended_at: null,
          suspended_reason: null,
          blocked_at: null,
          deleted_at: null,
          login_attempts: 0,
          lock_until: null,
          reactivation_otp: null,
          reactivation_otp_expires: null
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Account reactivated successfully! You can now log in.");
      onSuccess();
    } catch (error) {
      console.error("Activation error:", error);
      toast.error("Failed to activate account. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageToAdmin.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSendingMessage(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();

      // Get all super admin users
      const { data: superAdminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");

      if (!superAdminRoles || superAdminRoles.length === 0) {
        toast.error("No administrators found. Please try again later.");
        return;
      }

      // Send message to all super admins
      const messagePromises = superAdminRoles.map((admin) =>
        supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: admin.user_id,
          subject: `🚨 Urgent: Account Suspension Appeal from ${profile?.full_name || "User"}`,
          message: `${messageToAdmin}\n\n---\nUser Email: ${profile?.email}\nAccount Status: ${accountStatus}\nReason: ${reason || "Not specified"}`,
          is_read: false,
        })
      );

      await Promise.all(messagePromises);

      // Create notification for super admins
      const notificationPromises = superAdminRoles.map((admin) =>
        supabase.from("notifications").insert({
          user_id: admin.user_id,
          title: "🚨 Account Suspension Appeal",
          message: `${profile?.full_name || "A user"} has sent an appeal regarding their ${accountStatus} account.`,
          type: "security",
          is_read: false,
          metadata: { user_id: user.id, account_status: accountStatus }
        })
      );

      await Promise.all(notificationPromises);

      toast.success("Message sent to administrators successfully!");
      setMessageToAdmin("");
    } catch (error) {
      console.error("Message sending error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getIcon = () => {
    switch (accountStatus) {
      case 'blocked':
        return <ShieldX className="w-8 h-8 text-red-500" />;
      case 'deleted':
        return <ShieldX className="w-8 h-8 text-red-600" />;
      case 'locked':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      default:
        return <ShieldAlert className="w-8 h-8 text-destructive" />;
    }
  };

  const getTitle = () => {
    switch (accountStatus) {
      case 'blocked':
        return "Account Blocked";
      case 'deleted':
        return "Account Deleted";
      case 'locked':
        return "Account Temporarily Locked";
      default:
        return "Account Suspended";
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription>
            Your account access has been restricted and requires administrator approval to reactivate.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">
            ⚠️ WARNING: Your account may be permanently deleted if not reactivated soon.
          </AlertDescription>
        </Alert>

        <div className="space-y-5">
          {reason && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{reason}</AlertDescription>
            </Alert>
          )}

          {timeRemaining && accountStatus !== 'blocked' && accountStatus !== 'deleted' && (
            <div className="bg-muted p-5 rounded-lg text-center border">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Time remaining:</p>
              <p className="text-3xl font-bold text-foreground tracking-wide">{timeRemaining}</p>
            </div>
          )}

          {/* OTP Verification Section */}
          {requiresOtp && userId && (
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4 text-primary" />
                Enter Reactivation OTP
              </div>
              <p className="text-xs text-muted-foreground">
                An OTP has been sent to you by the administrator. Enter it below to reactivate your account.
              </p>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
              <Button 
                className="w-full" 
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || isVerifyingOtp}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Reactivate"
                )}
              </Button>
            </div>
          )}

          {/* Contact Support Section */}
          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Support
            </p>
            <div className="space-y-2">
              <a 
                href="mailto:support@justiceultimateautomobiles.com"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                support@justiceultimateautomobiles.com
              </a>
              <a 
                href="tel:+254722827458"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                +254 722 827 458
              </a>
            </div>
          </div>

          <Tabs defaultValue="message" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="message">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Admin
              </TabsTrigger>
              <TabsTrigger value="code">Activation Code</TabsTrigger>
            </TabsList>

            <TabsContent value="message" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send a message to the administrators explaining your situation. They will receive your message immediately and can assist with reactivating your account.
                </p>

                <div>
                  <label htmlFor="messageToAdmin" className="text-sm font-medium mb-2 block">
                    Your Message
                  </label>
                  <Textarea
                    id="messageToAdmin"
                    value={messageToAdmin}
                    onChange={(e) => setMessageToAdmin(e.target.value)}
                    placeholder="Please explain why you believe your account should be reactivated..."
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <Button 
                  onClick={handleSendMessage} 
                  className="w-full" 
                  disabled={isSendingMessage || !messageToAdmin.trim()}
                >
                  {isSendingMessage ? "Sending..." : "Send Message to Admin"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you have received an activation code from an administrator, you can enter it here to reactivate your account immediately.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="activationCode" className="text-sm font-medium mb-2 block">
                      Activation Code
                    </label>
                    <Input
                      id="activationCode"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      placeholder="Enter 8-character code from admin"
                      className="font-mono uppercase"
                      maxLength={8}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting || !activationCode.trim()}>
                    {isSubmitting ? "Activating..." : "Activate Account Now"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center pt-2">
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground">
              Return to Login
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};