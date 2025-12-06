// src/routes/voice.routes.js
import { Router } from "express";
import {
  handleIncomingCall,
  handleGather,
} from "../controllers/voice.controller.js";

const router = Router();

// Twilio webhooks
router.post("/voice", handleIncomingCall);
router.post("/voice/handle-gather", handleGather);

export default router;
