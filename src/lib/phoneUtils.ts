/**
 * Formats a Kenyan phone number to +254XXXXXXXXX format
 * Handles inputs like: 701234567, 0701234567, 254701234567, +254701234567, 701 234 567
 */
export function formatPhoneNumber(phone: string | number): string {
  // Convert to string and remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Remove leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove 254 prefix if present
  if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3);
  }
  
  return '+254' + cleaned;
}

/**
 * Validates a Kenyan phone number
 * Returns true if the number is valid (9 digits after removing country code)
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
export function formatAndValidatePhone(phone: string | number): string | null {
  if (!isValidKenyanPhone(phone)) {
    return null;
  }
  return formatPhoneNumber(phone);
}
