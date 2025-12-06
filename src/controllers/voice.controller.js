// src/controllers/voice.controller.js
import {
  buildInitialVoiceTwiml,
  buildGatherResponseTwiml,
} from "../services/twilio.service.js";

/**
 * Step 1: Twilio hits /twilio/voice when the call starts.
 */
export function handleIncomingCall(req, res, next) {
  try {
    const callSid = req.body.CallSid || "unknown-call";

    const twimlXml = buildInitialVoiceTwiml(callSid);

    res.type("text/xml");
    return res.send(twimlXml);
  } catch (err) {
    return next(err);
  }
}

/**
 * Step 2: Twilio posts speech result to /twilio/voice/handle-gather.
 */
export async function handleGather(req, res, next) {
  try {
    const callSid = req.body.CallSid || "unknown-call";
    const userText = (req.body.SpeechResult || "").trim();

    const twimlXml = await buildGatherResponseTwiml(callSid, userText);

    res.type("text/xml");
    return res.send(twimlXml);
  } catch (err) {
    return next(err);
  }
}
