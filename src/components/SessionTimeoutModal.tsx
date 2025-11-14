import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import hourglassGif from "@/assets/hourglass-simple.gif";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal = ({ isOpen, timeLeft, onExtend, onLogout }: SessionTimeoutModalProps) => {
  return (
    <>
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="glass-strong sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src={hourglassGif} alt="Hourglass" className="w-full h-full object-contain" />
              </div>
              <span>Stay Logged In?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-center space-y-2">
              <p>Your session will expire in</p>
              <p className="text-5xl font-bold text-primary animate-pulse">
                {timeLeft}s
              </p>
              <p className="text-sm text-muted-foreground">
                due to inactivity. Would you like to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={onLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Log Out
            </Button>
            <Button onClick={onExtend} className="w-full sm:w-auto">
              Continue Session
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SessionTimeoutModal;
