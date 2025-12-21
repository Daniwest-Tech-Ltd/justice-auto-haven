import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, MessageCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [messageToAdmin, setMessageToAdmin] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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
        .select("activation_code, account_status, full_name, email")
        .eq("user_id", user.id)
        .single();

      console.log('User attempting activation:', profile?.email);
      console.log('Entered code:', activationCode.trim());
      console.log('Expected code:', profile?.activation_code);

      if (profile?.activation_code !== activationCode.trim()) {
        toast.error("Invalid activation code. Please check and try again.");
        return;
      }

      const { error, data: updateData } = await supabase
        .from("profiles")
        .update({
          is_suspended: false,
          account_status: "active",
          activation_code: null,
          suspended_at: null,
          suspended_reason: null,
          login_attempts: 0, // Reset login attempts on successful reactivation
        })
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error('Activation update error:', error);
        throw error;
      }

      console.log('Account reactivated successfully:', updateData);

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

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();

      // Get all admin users
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (!adminRoles || adminRoles.length === 0) {
        toast.error("No administrators found. Please try again later.");
        return;
      }

      // Send message to all admins
      const messagePromises = adminRoles.map((admin) =>
        supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: admin.user_id,
          subject: `🚨 Urgent: Account Suspension Appeal from ${profile?.full_name || "User"}`,
          message: `${messageToAdmin}\n\n---\nUser Email: ${profile?.email}\nSuspension Reason: ${reason || "Not specified"}`,
          is_read: false,
        })
      );

      await Promise.all(messagePromises);

      // Create notification for admins
      const notificationPromises = adminRoles.map((admin) =>
        supabase.from("notifications").insert({
          user_id: admin.user_id,
          title: "Account Suspension Appeal",
          message: `${profile?.full_name || "A user"} has sent an appeal regarding their suspended account.`,
          type: "alert",
          is_read: false,
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

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            <DialogTitle>Account Suspended</DialogTitle>
          </div>
          <DialogDescription>
            Your account has been suspended and requires administrator approval to reactivate.
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

          {timeRemaining && (
            <div className="bg-muted p-5 rounded-lg text-center border">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Time remaining:</p>
              <p className="text-3xl font-bold text-foreground tracking-wide">{timeRemaining}</p>
            </div>
          )}

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
                    className="min-h-[150px] resize-none"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};