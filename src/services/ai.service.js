// src/services/ai.service.js
import OpenAI from "openai";
import config from "../config/env.js";

/**
 * Create a single OpenAI client for the whole app.
 */
const openai = new OpenAI({
  apiKey: config.openAiApiKey, // comes from OPENAI_API_KEY in .env
});

/**
 * Ask OpenAI for a reply based on the full conversation history.
 *
 * @param {Array<{ role: "system" | "user" | "assistant", content: string }>} messages
 * @returns {Promise<string>} assistant text reply
 */
export async function getAssistantReply(messages) {
  if (!config.openaiApiKey) {
    throw new Error("Missing OPENAI_API_KEY in environment");
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // you can change later if needed
    messages,
    max_tokens: 180,
    temperature: 0.7,
  });

  const answer = completion.choices[0]?.message?.content?.trim() || "";
  return answer;
}
