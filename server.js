// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import twilio from "twilio";

// dotenv.config();

// const app = express();

// // Twilio helper
// const { twiml: TwilioTwiml } = twilio;

// // Middleware
// app.use(cors());
// app.use(express.urlencoded({ extended: false })); // for Twilio webhook
// app.use(express.json());

// // Health check route
// app.get("/", (req, res) => {
//   res.send("AURAVOICE backend running successfully 🚀");
// });

// // Twilio voice webhook
// app.post("/twilio/voice", (req, res) => {
//   const response = new TwilioTwiml.VoiceResponse();

//   response.say(
//     {
//       voice: "Polly.Joanna", // we can change voice later
//       language: "en-US",
//     },
//     "Hi, this is Kshitij, CEO of AuraVoice ! How was your day? How can I help you, dear?"
//   );

//   res.type("text/xml");
//   res.send(response.toString());
// });

// // Start server
// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";
import OpenAI from "openai";

dotenv.config();

const app = express();
const { twiml: TwilioTwiml } = twilio;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("AURAVOICE backend running successfully 🚀");
});

// ---- AI Voice Webhook ----
app.post("/twilio/voice", async (req, res) => {
  const vr = new TwilioTwiml.VoiceResponse();

  try {
    // 1) Build a prompt for OpenAI
    const userText =
      "Caller is a restaurant customer. Greet them warmly and ask how you can help.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AURAVOICE, a friendly phone assistant for restaurants. " +
            "Be short, clear, and speak like a human on a call.",
        },
        { role: "user", content: userText },
      ],
      max_tokens: 120,
    });

    const aiReply =
      completion.choices[0].message.content ||
      "Hi, this is AURAVOICE. How can I help you today?";

    vr.say({ voice: "Polly.Joanna", language: "en-US" }, aiReply);

    res.type("text/xml");
    return res.send(vr.toString());
  } catch (err) {
    console.error("Error talking to OpenAI:", err);

    vr.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, something went wrong on our side. Please try again later."
    );
    res.type("text/xml");
    return res.send(vr.toString());
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
