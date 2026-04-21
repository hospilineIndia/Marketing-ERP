/**
 * Pure functions for cleaning and validating lead data extracted from OCR/AI.
 */

/**
 * Normalizes phone numbers specifically for Indian context.
 * - Removes non-digits
 * - Handles country code (91) for 12-digit numbers
 * - Handles leading zero for 11-digit numbers
 * - Returns exactly 10 digits or null
 */
export const cleanPhone = (val) => {
  if (!val) return null;

  let digits = val.toString().replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  if (digits.length === 10) {
    return digits;
  }

  return null;
};

/**
 * Standardizes email formatting and performs basic validation.
 * - Removes all spaces
 * - Handles OCR artifacts like (at) and [dot]
 * - Validates using basic regex
 */
export const cleanEmail = (val) => {
  if (!val) return null;
  
  let cleaned = val.toString().toLowerCase().replace(/\s+/g, "");
  
  // Replace OCR artifacts
  cleaned = cleaned
    .replace(/\(at\)|\[at\]/g, "@")
    .replace(/\(dot\)|\[dot\]/g, ".");
    
  // Basic validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(cleaned) ? cleaned : null;
};

/**
 * Normalizes and validates Indian GST format.
 * - OCR Error correction: O -> 0, I -> 1
 * - Strict regex validation
 */
export const cleanGST = (val) => {
  if (!val) return null;
  
  // Uppercase and remove all non-alphanumeric chars
  let cleaned = val.toString().toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  // Replace common OCR errors
  cleaned = cleaned.replace(/O/g, "0").replace(/I/g, "1");
  
  // Indian GST Regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  
  return gstRegex.test(cleaned) ? cleaned : null;
};

/**
 * Normalizes personal or business names.
 * - Trims whitespace
 * - Removes extra interior spaces
 * - Capitalizes each word
 */
export const cleanName = (val) => {
  if (!val) return null;
  
  const trimmed = val.toString().trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
