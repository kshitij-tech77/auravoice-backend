// src/middleware/errorHandler.js

/**
 * Central error handler – catches any errors bubbled up via next(err).
 */
export default function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  const status = err.status || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Error";

  res.status(status).json({ error: message });
}
