// // server.js
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import twilio from "twilio";
// import OpenAI from "openai";

// // Load .env file
// dotenv.config();

// const app = express();

// // Twilio helper – we use this to build XML for phone calls
// const { twiml } = twilio;
// const VoiceResponse = twiml.VoiceResponse;

// // OpenAI client – uses your real API key from .env
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Middlewares
// app.use(cors());
// app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded body
// app.use(express.json());

// // ------------------ BASIC ROUTES ------------------ //

// // Health check (for browser / Render)
// app.get("/", (req, res) => {
//   res.send("AURAVOICE backend running successfully 🚀");
// });

// // Test route to debug OpenAI in the browser
// app.get("/test/openai", async (req, res) => {
//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini", // if this errors, try "gpt-4.1-mini" or "gpt-4o"
//       messages: [
//         { role: "system", content: "You are a helpful assistant." },
//         { role: "user", content: "Say only: AURAVOICE TEST OK" },
//       ],
//       max_tokens: 20,
//     });

//     const reply = completion.choices[0].message.content;
//     return res.send(`OpenAI reply: ${reply}`);
//   } catch (err) {
//     console.error("OpenAI test error:", err);
//     const msg =
//       err.response?.data?.error?.message || err.message || "Unknown error";
//     return res.status(500).send("OpenAI error: " + msg);
//   }
// });

// // ------------------ TWILIO VOICE WEBHOOK ------------------ //

// app.post("/twilio/voice", async (req, res) => {
//   const vr = new VoiceResponse();

//   try {
//     // Ask OpenAI to act like your phone assistant
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are AURAVOICE, a friendly AI phone assistant for restaurants. " +
//             "You speak clearly and briefly, like a human receptionist.",
//         },
//         {
//           role: "user",
//           content:
//             "Greet the caller as AURAVOICE and ask how you can help them today.",
//         },
//       ],
//       max_tokens: 80,
//     });

//     const aiReply = completion.choices[0].message.content.trim();

//     // Speak the AI’s answer on the phone
//     vr.say(
//       {
//         voice: "Polly.Joanna", // nice female voice, change later if you want
//         language: "en-US",
//       },
//       aiReply
//     );
//   } catch (err) {
//     console.error("Error talking to OpenAI:", err);

//     // Fallback if anything breaks
//     vr.say("Sorry, something went wrong on our side. Please try again later.");
//   }

//   // Send TwiML XML back to Twilio
//   res.type("text/xml");
//   res.send(vr.toString());
// });

// // ------------------ START SERVER ------------------ //

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

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

// Step 1: greet + listen with <Gather>
app.post("/twilio/voice", (req, res) => {
  const vr = new VoiceResponse();

  // Tell Twilio to listen for speech and then hit /twilio/voice/handle-gather
  const gather = vr.gather({
    input: "speech",
    action: "/twilio/voice/handle-gather", // relative URL is fine
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

  // If Twilio doesn't get any speech, redirect and repeat the question once
  vr.redirect("/twilio/voice");

  res.type("text/xml");
  res.send(vr.toString());
});

// Step 2: handle the user's speech and reply using OpenAI
app.post("/twilio/voice/handle-gather", async (req, res) => {
  try {
    const userText = req.body.SpeechResult || "";
    console.log("User said:", userText);

    if (!userText) {
      const vr = new VoiceResponse();
      vr.say(
        { voice: "Polly.Joanna", language: "en-US" },
        "Sorry, I didn't catch that. Please call again."
      );
      vr.hangup();
      res.type("text/xml").send(vr.toString());
      return;
    }

    // Ask OpenAI to act like your restaurant assistant
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a warm, concise phone assistant for a restaurant called Everest Grill and Wrap in San Bernardino, California. " +
            "You answer like a real human on the phone. Keep replies short, one or two sentences. " +
            "You can answer about hours, location, popular dishes, and basic menu questions. If something is impossible on this call, say it kindly.",
        },
        {
          role: "user",
          content: userText,
        },
      ],
      max_tokens: 120,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log("Assistant answer:", answer);

    const vr = new VoiceResponse();
    vr.say({ voice: "Polly.Joanna", language: "en-US" }, answer);
    vr.hangup();

    res.type("text/xml");
    res.send(vr.toString());
  } catch (err) {
    console.error("Error in /twilio/voice/handle-gather:", err);

    const vr = new VoiceResponse();
    vr.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, something went wrong while answering your question. Please try again later."
    );
    vr.hangup();

    res.type("text/xml");
    res.send(vr.toString());
  }
});

// ------------------ START SERVER ------------------ //

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
