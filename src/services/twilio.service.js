// src/services/twilio.service.js
import twilio from "twilio";
import {
  getOrCreateConversation,
  addUserMessage,
  addAssistantMessage,
  getMessages,
} from "./conversation.service.js";
import { getAssistantReply } from "./ai.service.js";

const { twiml } = twilio;

/**
 * Build the initial TwiML when a call starts.
 */
export function buildInitialVoiceTwiml(callSid) {
  // Make sure conversation exists (adds system prompt)
  getOrCreateConversation(callSid);

  const response = new twiml.VoiceResponse();

  const gather = response.gather({
    input: "speech",
    action: "/twilio/voice/handle-gather",
    method: "POST",
    speechTimeout: "auto",
  });

  gather.say(
    { voice: "Polly.Joanna", language: "en-US" },
    "Hey, this is AuraVoice, your friendly restaurant assistant. How can I help you today?"
  );

  // If Twilio hears nothing, try again once
  response.redirect("/twilio/voice");

  return response.toString();
}

/**
 * Build TwiML after the user has spoken (Twilio /handle-gather).
 */
export async function buildGatherResponseTwiml(callSid, userText) {
  const response = new twiml.VoiceResponse();

  // If Twilio didn’t detect speech
  if (!userText) {
    response.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Sorry, I didn't catch that."
    );

    const gather = response.gather({
      input: "speech",
      action: "/twilio/voice/handle-gather",
      method: "POST",
      speechTimeout: "auto",
    });

    gather.say(
      { voice: "Polly.Joanna", language: "en-US" },
      "Can you please repeat your question?"
    );

    return response.toString();
  }

  // 1) Save user message
  addUserMessage(callSid, userText);

  // 2) Get full history for this call
  const messages = getMessages(callSid);

  // 3) Ask OpenAI
  const answer = await getAssistantReply(messages);

  // 4) Save assistant message
  addAssistantMessage(callSid, answer);

  // 5) Say the answer
  response.say({ voice: "Polly.Joanna", language: "en-US" }, answer);

  // 6) Ask if they need anything else and start another gather
  response.pause({ length: 0.5 });

  const gather = response.gather({
    input: "speech",
    action: "/twilio/voice/handle-gather",
    method: "POST",
    speechTimeout: "auto",
  });

  gather.say(
    { voice: "Polly.Joanna", language: "en-US" },
    "Is there anything else I can help you with?"
  );

  return response.toString();
}
