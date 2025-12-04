/**
 * Formats a phone number with a given country code
 * Handles inputs like: 701234567, 0701234567, 254701234567, +254701234567, 701 234 567
 */
export function formatPhoneNumber(phone: string | number, countryCode: string = '+254'): string {
  // Convert to string and remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove country code digits if present at start
  const codeDigits = countryCode.replace(/\D/g, '');
  if (cleaned.startsWith(codeDigits)) {
    cleaned = cleaned.substring(codeDigits.length);
  }
  
  // Ensure country code starts with +
  const formattedCode = countryCode.startsWith('+') ? countryCode : '+' + countryCode;
  
  return formattedCode + cleaned;
}

/**
 * Validates a phone number
 * Returns true if the number has 7-12 digits (to accommodate various African countries)
 */
export function isValidPhone(phone: string | number): boolean {
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove common country code prefixes
  if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3);
  }
  
  // Valid phone number should have 7-12 digits
  return cleaned.length >= 7 && cleaned.length <= 12;
}

/**
 * Validates specifically for Kenyan numbers (9 digits)
 */
export function isValidKenyanPhone(phone: string | number): boolean {
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Remove leading zero
  let digits = cleaned;
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  // Remove 254 prefix if present
  if (digits.startsWith('254')) {
    digits = digits.substring(3);
  }
  
  // Valid Kenyan number should have exactly 9 digits
  return digits.length === 9;
}

/**
 * Formats and validates a phone number, returns null if invalid
 */
export function formatAndValidatePhone(phone: string | number, countryCode: string = '+254'): string | null {
  if (!isValidPhone(phone)) {
    return null;
  }
  return formatPhoneNumber(phone, countryCode);
}
