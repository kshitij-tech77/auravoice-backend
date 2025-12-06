// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import config from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import voiceRoutes from "./routes/voice.routes.js";
import testRoutes from "./routes/test.routes.js";
import requestLogger from "./middleware/requestLogger.js";
import errorHandler from "./middleware/errorHandler.js";
import { applySecurityHeaders } from "./middleware/security.js";

const app = express();

// Security
app.use(helmet());
applySecurityHeaders(app);

// CORS (open in dev, locked in prod)
app.use(
  cors({
    origin:
      config.nodeEnv === "production"
        ? ["https://your-frontend-domain.com"] // TODO: replace when you have a frontend
        : "*",
  })
);

// Body parsers (Twilio sends urlencoded)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging
if (config.nodeEnv !== "test") {
  app.use(morgan("combined"));
}
app.use(requestLogger);

// Rate limiting – simple global limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60, // 60 requests per minute per IP
});
app.use(apiLimiter);

// Routes
app.use("/health", healthRoutes);
app.use("/twilio", voiceRoutes);
app.use("/test", testRoutes);

// Default root (for browser quick check)
app.get("/", (req, res) => {
  res.send("AURAVOICE backend running successfully 🚀");
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
