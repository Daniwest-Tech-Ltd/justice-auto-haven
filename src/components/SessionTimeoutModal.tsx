import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
              <div className="hourglass-container">
                <div className="hourglass">
                  <div className="hourglass-top" />
                  <div className="hourglass-bottom" />
                  <div className="hourglass-sand" />
                </div>
              </div>
              <span>Stay Logged In?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-center space-y-2">
              <p>Your session will expire in</p>
              <p className="text-4xl font-bold text-primary animate-pulse">
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
      
      <style>{`
        .hourglass-container {
          perspective: 1000px;
        }
        
        .hourglass {
          position: relative;
          width: 60px;
          height: 80px;
          display: inline-block;
          animation: rotateHourglass 3s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        
        .hourglass-top,
        .hourglass-bottom {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 30px solid transparent;
          border-right: 30px solid transparent;
          left: 0;
        }
        
        .hourglass-top {
          top: 0;
          border-top: 35px solid hsl(var(--primary) / 0.8);
          filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.5));
        }
        
        .hourglass-bottom {
          bottom: 0;
          border-bottom: 35px solid hsl(var(--primary) / 0.8);
          filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.5));
        }
        
        .hourglass-sand {
          position: absolute;
          width: 8px;
          height: 8px;
          background: hsl(var(--primary));
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: sandFlow 1.5s ease-in-out infinite;
          filter: drop-shadow(0 0 4px hsl(var(--primary)));
        }
        
        @keyframes rotateHourglass {
          0%, 45% {
            transform: rotate(0deg);
          }
          50%, 95% {
            transform: rotate(180deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes sandFlow {
          0%, 100% {
            top: 30%;
            opacity: 1;
          }
          50% {
            top: 70%;
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

export default SessionTimeoutModal;
