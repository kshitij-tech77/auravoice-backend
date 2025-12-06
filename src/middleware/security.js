// src/middleware/security.js

/**
 * Extra security-related Express configuration.
 * Helmet is applied in app.js; this disables some headers.
 */
export function applySecurityHeaders(app) {
  // Hide tech stack
  app.disable("x-powered-by");
}
