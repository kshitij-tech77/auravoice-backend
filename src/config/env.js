// src/config/env.js
import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized configuration for the AuraVoice backend.
 * All environment variables are read and validated here.
 */
const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 10000,
  openAiApiKey: process.env.OPENAI_API_KEY,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
};

if (!config.twilio.accountSid || !config.twilio.authToken) {
  console.warn(
    "⚠️ Twilio credentials are not fully set – voice features may not work correctly."
  );
}

if (!config.openAiApiKey) {
  console.warn(
    "⚠️ OPENAI_API_KEY is not set – AI features will be disabled for now."
  );
}

export default config;
