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

// Twilio helper
const { twiml } = twilio;
const VoiceResponse = twiml.VoiceResponse;

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false })); // for Twilio webhook (x-www-form-urlencoded)
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("AURAVOICE backend running successfully 🚀");
});

/**
 * Twilio voice webhook
 * 1st hit: no SpeechResult -> greet + <Gather> speech
 * 2nd hit: has SpeechResult -> call OpenAI and respond
 */
app.post("/twilio/voice", async (req, res) => {
  const vr = new VoiceResponse();

  const speech = req.body.SpeechResult;
  const from = req.body.From;

  console.log("Incoming call from:", from);
  console.log("SpeechResult:", speech);

  // ---- First request: ask the caller what they want ----
  if (!speech) {
    const gather = vr.gather({
      input: "speech",
      action: "/twilio/voice", // Twilio posts back here with SpeechResult
      method: "POST",
      speechTimeout: "auto",
    });

    gather.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      "Hi, you have reached Aura Voice for Everest Grill and Wrap. " +
        "How can I help you today? You can ask about hours, location, or menu items."
    );

    // Fallback if no speech at all
    vr.say("Sorry, I did not hear anything. Goodbye.");
    vr.hangup();

    res.type("text/xml");
    return res.send(vr.toString());
  }

  // ---- Second request: we have what the caller said ----
  try {
    const userPrompt = `
You are a friendly phone assistant for a restaurant called Everest Grill & Wrap in San Bernardino.
Keep answers short, 2–3 sentences.
If someone tries to place an order or reservation, say this is a demo line and they should call the real restaurant number.

Caller said: "${speech}"
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful restaurant phone assistant.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    const answer =
      completion.choices[0].message.content ||
      "Sorry, I am not sure how to answer that.";

    console.log("OpenAI answer:", answer);

    vr.say(
      {
        voice: "Polly.Joanna",
        language: "en-US",
      },
      answer
    );

    vr.say("Thank you for calling. Goodbye.");
    vr.hangup();

    res.type("text/xml");
    return res.send(vr.toString());
  } catch (err) {
    console.error("Error talking to OpenAI:", err);

    vr.say("Sorry, something went wrong on our side.");
    vr.hangup();

    res.type("text/xml");
    return res.send(vr.toString());
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
