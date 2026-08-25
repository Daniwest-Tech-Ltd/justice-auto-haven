/**
 * USSD response helpers.
 * Africa's Talking expects plain-text responses prefixed with:
 *   CON — the session continues, show the menu and wait for input
 *   END — the session is over, show the final message
 */

/**
 * Continue a USSD session.
 * @param {string} message
 * @returns {string}
 */
function con(message) {
  return `CON ${message}`;
}

/**
 * End a USSD session.
 * @param {string} message
 * @returns {string}
 */
function end(message) {
  return `END ${message}`;
}

module.exports = { con, end };
