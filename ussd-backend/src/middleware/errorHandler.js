/**
 * Central error handler.
 * For USSD routes the controller already degrades to a friendly END message,
 * so this handler mainly protects JSON/health endpoints and unexpected crashes.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[ErrorHandler]", err && err.stack ? err.stack : err);

  // If the request was a USSD callback, respond in USSD plain-text format
  // so the gateway always receives a valid response.
  if (req.path && req.path.includes("/ussd")) {
    res.set("Content-Type", "text/plain");
    return res
      .status(200)
      .send(
        "END Sorry, our service is temporarily unavailable.\n\nPlease call 0722827458 for assistance."
      );
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}

module.exports = { errorHandler };
