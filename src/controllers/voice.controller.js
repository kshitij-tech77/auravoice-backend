// src/controllers/voice.controller.js
import {
  buildGatherResponseTwiml,
  buildInitialVoiceTwiml,
} from "../services/twilio.service.js";

/**
 * Handles the initial Twilio webhook for an incoming call.
 * POST /twilio/voice
 */
export const handleIncomingCall = (req, res, next) => {
  try {
    const callSid = req.body.CallSid;
    const xml = buildInitialVoiceTwiml(callSid);

    res.type("text/xml").send(xml);
  } catch (err) {
    next(err);
  }
};

/**
 * Handles speech results from Twilio's <Gather>.
 * POST /twilio/voice/handle-gather
 */
export const handleGather = async (req, res, next) => {
  try {
    const callSid = req.body.CallSid;
    const userText = (req.body.SpeechResult || "").trim();

    const xml = await buildGatherResponseTwiml(callSid, userText);

    res.type("text/xml").send(xml);
  } catch (err) {
    next(err);
  }
};
