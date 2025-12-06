// src/routes/test.routes.js
import { Router } from "express";
import { openAiTest } from "../controllers/test.controller.js";

const router = Router();

// GET /test/openai
router.get("/openai", openAiTest);

export default router;
