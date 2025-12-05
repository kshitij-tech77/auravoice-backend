import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();

// Twilio helper
const { twiml: TwilioTwiml } = twilio;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false })); // for Twilio webhook
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("AURAVOICE backend running successfully 🚀");
});

// Twilio voice webhook
app.post("/twilio/voice", (req, res) => {
  const response = new TwilioTwiml.VoiceResponse();

  response.say(
    {
      voice: "Polly.Joanna", // we can change voice later
      language: "en-US",
    },
    "Hi, this is Kshitij, CEO of AuraVoice ! How was your day? How can I help you, dear?"
  );

  res.type("text/xml");
  res.send(response.toString());
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
