// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";
import OpenAI from "openai";

// Load .env file
dotenv.config();

const app = express();

// Twilio helper – we use this to build XML for phone calls
const { twiml } = twilio;
const VoiceResponse = twiml.VoiceResponse;

// OpenAI client – uses your real API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded body
app.use(express.json());

// ------------------ BASIC ROUTES ------------------ //

// Health check (for browser / Render)
app.get("/", (req, res) => {
  res.send("AURAVOICE backend running successfully 🚀");
});

// Test route to debug OpenAI in the browser
app.get("/test/openai", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // if this errors, try "gpt-4.1-mini" or "gpt-4o"
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say only: AURAVOICE TEST OK" },
      ],
      max_tokens: 20,
    });

    const reply = completion.choices[0].message.content;
    return res.send(`OpenAI reply: ${reply}`);
  } catch (err) {
    console.error("OpenAI test error:", err);
    const msg =
      err.response?.data?.error?.message || err.message || "Unknown error";
    return res.status(500).send("OpenAI error: " + msg);
  }
});

// ------------------ TWILIO VOICE WEBHOOK ------------------ //

app.post("/twilio/voice", async (req, res) => {
  const vr = new VoiceResponse();

  try {
    // Ask OpenAI to act like your phone assistant
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AURAVOICE, a friendly AI phone assistant for restaurants. " +
            "You speak clearly and briefly, like a human receptionist.",
        },
        {
          role: "user",
          content:
            "Greet the caller as AURAVOICE and ask how you can help them today.",
        },
      ],
      max_tokens: 80,
    });

    const aiReply = completion.choices[0].message.content.trim();

    // Speak the AI’s answer on the phone
    vr.say(
      {
        voice: "Polly.Joanna", // nice female voice, change later if you want
        language: "en-US",
      },
      aiReply
    );
  } catch (err) {
    console.error("Error talking to OpenAI:", err);

    // Fallback if anything breaks
    vr.say("Sorry, something went wrong on our side. Please try again later.");
  }

  // Send TwiML XML back to Twilio
  res.type("text/xml");
  res.send(vr.toString());
});

// ------------------ START SERVER ------------------ //

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
