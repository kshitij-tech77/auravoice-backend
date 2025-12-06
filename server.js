import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";
import OpenAI from "openai";
// Simple in-memory store: CallSid -> array of messages
const conversations = {};

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
// Step 1: greet + start the loop
app.post("/twilio/voice", (req, res) => {
  const vr = new TwilioTwiml.VoiceResponse();
  const callSid = req.body.CallSid;

  // If this is the first time we see this call, create the conversation
  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: "system",
        content:
          "You are a warm, concise phone assistant for a restaurant called Everest Grill and Wrap in San Bernardino, California. " +
          "You sound like a real human. Keep replies short, one or two sentences. " +
          "You can answer about hours, location, popular dishes, and basic menu questions. " +
          "If something is impossible on this call, say it kindly.",
      },
    ];
  }

  // Ask the question and start listening
  const gather = vr.gather({
    input: "speech",
    action: "/twilio/voice/handle-gather",
    method: "POST",
    speechTimeout: "auto",
  });

  gather.say(
    {
      voice: "Polly.Joanna",
      language: "en-US",
    },
    "Hey, this is AuraVoice, your friendly restaurant assistant. How can I help you today?"
  );

  // If Twilio hears nothing, we’ll just come back here once
  vr.redirect("/twilio/voice");

  res.type("text/xml");
  res.send(vr.toString());
});
// Step 2: handle speech, ask OpenAI, reply, and loop
app.post("/twilio/voice/handle-gather", async (req, res) => {
  const callSid = req.body.CallSid;
  const userText = (req.body.SpeechResult || "").trim();
  console.log("User said:", userText);

  const vr = new TwilioTwiml.VoiceResponse();

  if (!userText) {
    vr.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, I didn't catch that."
    );
    // Ask again
    const gather = vr.gather({
      input: "speech",
      action: "/twilio/voice/handle-gather",
      method: "POST",
      speechTimeout: "auto",
    });
    gather.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Can you please repeat your question?"
    );
    res.type("text/xml").send(vr.toString());
    return;
  }

  try {
    // Get existing conversation or init
    let messages = conversations[callSid];
    if (!messages) {
      messages = conversations[callSid] = [
        {
          role: "system",
          content:
            "You are a warm, concise phone assistant for a restaurant called Everest Grill and Wrap in San Bernardino, California.",
        },
      ];
    }

    // Add user message
    messages.push({ role: "user", content: userText });

    // Call OpenAI with full history
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log("Assistant answer:", answer);

    // Save assistant message to history
    messages.push({ role: "assistant", content: answer });
    conversations[callSid] = messages;

    // Speak the answer
    vr.say({ voice: "Polly.Joanna", language: "en-US" }, answer);

    // ➜ Instead of hangup, ask if they need anything else and listen again
    vr.pause({ length: 0.5 });
    const gather = vr.gather({
      input: "speech",
      action: "/twilio/voice/handle-gather",
      method: "POST",
      speechTimeout: "auto",
    });

    gather.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Is there anything else I can help you with?"
    );

    res.type("text/xml");
    res.send(vr.toString());
  } catch (err) {
    console.error("Error in /twilio/voice/handle-gather:", err);

    vr.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, something went wrong while answering your question. Please try again later."
    );
    vr.hangup();
    res.type("text/xml").send(vr.toString());
  }
});

// ------------------ START SERVER ------------------ //

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
