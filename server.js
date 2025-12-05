const express = require("express");
const cors = require("cors");
const { twiml } = require("twilio");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("AURAVOICE backend running successfully 🚀");
});

// Twilio voice webhook
app.post("/twilio/voice", (req, res) => {
  const response = new twiml.VoiceResponse();

  // Simple first version – later we'll plug OpenAI here
  response.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Hi! This is AuraVoice A I. Thanks for calling. How can I help you today?"
  );

  res.type("text/xml");
  res.send(response.toString());
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
