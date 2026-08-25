/**
 * Helpers for parsing Africa's Talking USSD `text` navigation values.
 *
 * Africa's Talking sends the ENTIRE navigation history in `text`,
 * joined by asterisks:
 *   ""                                  -> user just dialled in
 *   "1"                                 -> picked option 1 at the main menu
 *   "1*2"                               -> option 1, then option 2
 *   "4*3*Daniel*1*Toyota Harrier*..."   -> deeper data-entry flow
 */

/**
 * Split the raw text value into clean navigation parts.
 * @param {string} text
 * @returns {string[]}
 */
function parseText(text) {
  if (!text || typeof text !== "string") return [];
  return text.split("*").map((part) => part.trim());
}

/**
 * The latest input the user provided.
 * @param {string[]} parts
 * @returns {string}
 */
function lastInput(parts) {
  return parts.length ? parts[parts.length - 1] : "";
}

/**
 * Basic input sanitiser — trims, collapses whitespace and caps length
 * so USSD free-text fields stay safe to store.
 * @param {string} value
 * @param {number} [maxLength=120]
 * @returns {string}
 */
function sanitizeInput(value, maxLength = 120) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

/**
 * Normalise a Kenyan phone number for storage (best-effort).
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  if (typeof phone !== "string") return "";
  return phone.replace(/[^\d+]/g, "").slice(0, 20);
}

/**
 * Format a number as Kenyan Shillings for USSD display.
 * @param {number|string} amount
 * @returns {string}
 */
function formatKsh(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "N/A";
  return `KSh ${n.toLocaleString("en-KE")}`;
}

module.exports = {
  parseText,
  lastInput,
  sanitizeInput,
  normalizePhone,
  formatKsh,
};
