/**
 * Lightweight request logger.
 * Logs method, path and response time without leaking sensitive payloads.
 * USSD bodies contain phone numbers, so we only log that a session
 * occurred — never the full payload.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const safePath = req.originalUrl || req.url;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${safePath} -> ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

module.exports = { requestLogger };
