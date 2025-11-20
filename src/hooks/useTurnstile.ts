import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      getResponse: (widgetId?: string) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export const useTurnstile = (siteKey: string) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Wait for Turnstile script to load
    const checkTurnstile = setInterval(() => {
      if (window.turnstile && containerRef.current) {
        clearInterval(checkTurnstile);
        
        // Render the widget
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setToken(token);
            },
            'error-callback': () => {
              setToken('');
            },
            'expired-callback': () => {
              setToken('');
            },
          });
          setIsReady(true);
        } catch (error) {
          console.error('Turnstile render error:', error);
        }
      }
    }, 100);

    return () => {
      clearInterval(checkTurnstile);
      // Cleanup widget on unmount
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Turnstile cleanup error:', error);
        }
      }
    };
  }, [siteKey]);

  const getToken = (): string => {
    if (window.turnstile && widgetIdRef.current) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return token;
  };

  const reset = () => {
    if (window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setToken('');
      } catch (error) {
        console.error('Turnstile reset error:', error);
      }
    }
  };

  return {
    containerRef,
    isReady,
    getToken,
    reset,
    token,
  };
};
