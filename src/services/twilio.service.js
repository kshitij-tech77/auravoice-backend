// src/services/twilio.service.js
import twilio from "twilio";
import {
  addAssistantMessage,
  addUserMessage,
  getMessages,
  getOrCreateConversation,
} from "./conversation.service.js";
import { getAiReply } from "./ai.service.js";

const { twiml: TwilioTwiml } = twilio;

/**
 * Builds the initial TwiML response when the call first hits /twilio/voice.
 */
export function buildInitialVoiceTwiml(callSid) {
  const vr = new TwilioTwiml.VoiceResponse();

  // Ensure conversation exists
  getOrCreateConversation(callSid);

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

  // In case nothing is heard, Twilio can redirect and try again
  vr.redirect("/twilio/voice");

  return vr.toString();
}

/**
 * Builds TwiML response after Twilio sends us speech input.
 */
export async function buildGatherResponseTwiml(callSid, userText) {
  const vr = new TwilioTwiml.VoiceResponse();

  // If nothing said, apologize and ask again
  if (!userText) {
    vr.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, I didn't catch that."
    );

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

    return vr.toString();
  }

  console.log(`User (${callSid}) said:`, userText);

  try {
    // Add user message to conversation
    addUserMessage(callSid, userText);

    const messages = getMessages(callSid);

    // Get AI reply
    const answer = await getAiReply(messages);

    console.log(`Assistant (${callSid}) answer:`, answer);

    // Save assistant message
    addAssistantMessage(callSid, answer);

    // Speak the answer
    vr.say({ voice: "Polly.Joanna", language: "en-US" }, answer);

    // Ask if they need anything else and listen again
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

    return vr.toString();
  } catch (err) {
    console.error("Error while generating AI reply:", err);

    vr.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, something went wrong while answering your question. Please try again later."
    );
    vr.hangup();

    return vr.toString();
  }
}
