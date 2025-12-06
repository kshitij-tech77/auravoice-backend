// src/controllers/health.controller.js

/**
 * Health check endpoint for monitoring.
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auravoice-backend",
    timestamp: new Date().toISOString(),
  });
};
