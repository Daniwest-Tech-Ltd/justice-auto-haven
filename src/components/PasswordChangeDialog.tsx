import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { calculatePasswordStrength } from "@/lib/passwordStrength";

interface PasswordChangeDialogProps {
  userEmail: string;
  userName: string;
  trigger?: React.ReactNode;
}

export const PasswordChangeDialog = ({ userEmail, userName, trigger }: PasswordChangeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = calculatePasswordStrength(newPassword);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (passwordStrength.level === 'weak') {
      toast.error("Please choose a stronger password");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error("Failed to update password: " + updateError.message);
        setIsLoading(false);
        return;
      }

      // Step 3: Send email notification
      try {
        await supabase.functions.invoke('send-password-change-notification', {
          body: {
            email: userEmail,
            userName: userName,
          }
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't block the password change if email fails
      }

      // Step 4: Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'password_changed',
          metadata: { 
            timestamp: new Date().toISOString(),
            method: 'dashboard_settings'
          }
        });
      }

      toast.success("Password changed successfully! You will be logged out.");
      
      // Step 5: Close dialog and logout
      setOpen(false);
      resetForm();
      
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }, 2000);

    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthMeter password={newPassword} />
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
              <p className="text-sm text-success">Passwords match ✓</p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">Security Notice:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>You will be logged out after changing your password</li>
              <li>Use your new password to log back in</li>
              <li>An email notification will be sent to your registered email</li>
            </ul>
          </div>

          <Button 
            onClick={handlePasswordChange} 
            className="w-full"
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {isLoading ? "Changing Password..." : "Change Password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
