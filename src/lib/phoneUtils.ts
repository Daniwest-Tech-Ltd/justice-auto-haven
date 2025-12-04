/**
 * Formats a phone number with a given country code
 * Handles inputs like: 701234567, 0701234567, 254701234567, +254701234567, 701 234 567
 * Always outputs: +XXXXXXXXXXXXX format
 */
export function formatPhoneNumber(phone: string | number, countryCode: string = '+254'): string {
  // Convert to string and remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Get country code digits for comparison
  const codeDigits = countryCode.replace(/\D/g, '');
  
  // Remove country code digits if present at start
  if (cleaned.startsWith(codeDigits)) {
    cleaned = cleaned.substring(codeDigits.length);
  }
  
  // Remove leading zero (common in Kenya and other African countries)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Ensure country code starts with +
  const formattedCode = countryCode.startsWith('+') ? countryCode : '+' + countryCode;
  
  return formattedCode + cleaned;
}

/**
 * Validates a phone number
 * Returns true if the number has 7-12 digits (to accommodate various African countries)
 */
export function isValidPhone(phone: string | number, countryCode: string = '+254'): boolean {
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Get country code digits for comparison
  const codeDigits = countryCode.replace(/\D/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith(codeDigits)) {
    cleaned = cleaned.substring(codeDigits.length);
  }
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Valid phone number should have 7-12 digits
  return cleaned.length >= 7 && cleaned.length <= 12;
}

/**
 * Validates specifically for Kenyan numbers (9 digits)
 */
export function isValidKenyanPhone(phone: string | number): boolean {
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Remove 254 prefix if present
  if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3);
  }
  
  // Remove leading zero if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Valid Kenyan number should have exactly 9 digits and start with 7 or 1
  return cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'));
}

/**
 * Formats and validates a phone number, returns null if invalid
 */
export function formatAndValidatePhone(phone: string | number, countryCode: string = '+254'): string | null {
  if (!isValidPhone(phone, countryCode)) {
    return null;
  }
  return formatPhoneNumber(phone, countryCode);
}

/**
 * Cleans phone number for storage (removes leading 0 and country code)
 * Stores just the 9-digit number
 */
export function cleanPhoneForStorage(phone: string | number, countryCode: string = '+254'): string {
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Get country code digits for comparison
  const codeDigits = countryCode.replace(/\D/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith(codeDigits)) {
    cleaned = cleaned.substring(codeDigits.length);
  }
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}
