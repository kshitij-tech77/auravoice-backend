// src/middleware/requestLogger.js

/**
 * Lightweight request logger for debugging and performance insight.
 */
export default function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[${req.method}] ${req.originalUrl} → ${res.statusCode} (${ms}ms)`
    );
  });

  next();
}
