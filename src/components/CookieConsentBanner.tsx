import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getCookieConsent, setCookieConsent } from "@/lib/cookies";
import { Link } from "react-router-dom";

export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const consent = getCookieConsent();
    if (consent === null) {
      setShowBanner(true);
    }
  }, []);

  const handleDecision = async (decision: 'accepted' | 'declined') => {
    setIsLoading(true);
    try {
      await setCookieConsent(decision);
      setShowBanner(false);
      
      // Reload page if accepted to enable analytics
      if (decision === 'accepted') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error setting cookie consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border shadow-lg animate-in slide-in-from-bottom"
      role="dialog"
      aria-label="Cookie consent banner"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <p id="cookie-consent-description" className="text-sm text-foreground/90">
              🍪 This site uses cookies to enhance your browsing experience and analyze site traffic. 
              By continuing to use this website, you agree to their use. 
              To learn more, read our{" "}
              <Link 
                to="/cookie-policy" 
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => handleDecision('declined')}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              Decline
            </Button>
            <Button
              onClick={() => handleDecision('accepted')}
              size="sm"
              disabled={isLoading}
              className="bg-[#28a745] hover:bg-[#218838] text-white"
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBanner(false)}
              disabled={isLoading}
              aria-label="Close banner"
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;