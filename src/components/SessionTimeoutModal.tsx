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
                  <div className="hourglass-glass">
                    <div className="sand-top"></div>
                    <div className="sand-bottom"></div>
                    <div className="sand-stream"></div>
                  </div>
                </div>
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
      
      <style>{`
        .hourglass-container {
          perspective: 1200px;
          margin: 10px 0;
        }
        
        .hourglass {
          position: relative;
          width: 80px;
          height: 120px;
          display: inline-block;
          animation: rotateHourglass 4s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        
        .hourglass-glass {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.15) 100%
          );
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 40px;
          box-shadow: 
            0 0 30px rgba(0, 123, 255, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        
        .hourglass-glass::before {
          content: '';
          position: absolute;
          top: 10%;
          left: -20%;
          width: 40%;
          height: 80%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.3) 50%, 
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: glassShine 3s ease-in-out infinite;
        }
        
        .sand-top,
        .sand-bottom {
          position: absolute;
          width: 60%;
          left: 20%;
          background: linear-gradient(180deg, 
            hsl(var(--primary) / 0.9) 0%,
            hsl(var(--primary) / 0.7) 100%
          );
          box-shadow: 
            0 0 15px hsl(var(--primary) / 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3);
          border-radius: 0 0 30px 30px;
          animation: sandDrain 4s ease-in-out infinite;
        }
        
        .sand-top {
          top: 8%;
          height: 35%;
          clip-path: polygon(50% 100%, 0 0, 100% 0);
        }
        
        .sand-bottom {
          bottom: 8%;
          height: 0%;
          clip-path: polygon(50% 0, 0 100%, 100% 100%);
          border-radius: 30px 30px 0 0;
          animation: sandFill 4s ease-in-out infinite;
        }
        
        .sand-stream {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, 
            hsl(var(--primary)) 0%,
            hsl(var(--primary) / 0.5) 100%
          );
          opacity: 0;
          animation: sandStream 4s ease-in-out infinite;
          filter: blur(0.5px);
          box-shadow: 0 0 8px hsl(var(--primary) / 0.8);
        }
        
        @keyframes rotateHourglass {
          0%, 48% {
            transform: rotate(0deg);
          }
          50%, 98% {
            transform: rotate(180deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes sandDrain {
          0%, 48% {
            height: 35%;
            opacity: 1;
          }
          49%, 98% {
            height: 5%;
            opacity: 0.8;
          }
          100% {
            height: 35%;
            opacity: 1;
          }
        }
        
        @keyframes sandFill {
          0%, 48% {
            height: 0%;
            opacity: 0.8;
          }
          49%, 98% {
            height: 35%;
            opacity: 1;
          }
          100% {
            height: 0%;
            opacity: 0.8;
          }
        }
        
        @keyframes sandStream {
          0%, 10% {
            opacity: 0;
            height: 0px;
          }
          15%, 45% {
            opacity: 1;
            height: 25px;
          }
          48%, 100% {
            opacity: 0;
            height: 0px;
          }
        }
        
        @keyframes glassShine {
          0%, 100% {
            left: -20%;
            opacity: 0;
          }
          50% {
            left: 120%;
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default SessionTimeoutModal;
