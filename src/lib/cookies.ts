import { supabase } from "@/integrations/supabase/client";

export type CookieConsent = 'accepted' | 'declined' | null;

const COOKIE_NAME = 'cookie_consent';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Get the current cookie consent value
 */
export function getCookieConsent(): CookieConsent {
  const cookies = document.cookie.split(';');
  const consentCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${COOKIE_NAME}=`)
  );
  
  if (!consentCookie) return null;
  
  const value = consentCookie.split('=')[1];
  return (value === 'accepted' || value === 'declined') ? value : null;
}

/**
 * Set cookie consent and log to backend
 */
export async function setCookieConsent(decision: 'accepted' | 'declined'): Promise<void> {
  // Set the cookie
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
  
  const isSecure = window.location.protocol === 'https:';
  const cookieString = `${COOKIE_NAME}=${decision}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  
  document.cookie = cookieString;

  // Log to backend
  try {
    const { error } = await supabase.functions.invoke('log-cookie-consent', {
      body: { decision }
    });

    if (error) {
      console.error('Failed to log cookie consent:', error);
    }
  } catch (error) {
    console.error('Error logging cookie consent:', error);
  }
}

/**
 * Check if non-essential scripts should be loaded
 */
export function canLoadNonEssentialScripts(): boolean {
  return getCookieConsent() === 'accepted';
}

/**
 * Clear cookie consent (for testing or user request)
 */
export function clearCookieConsent(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}