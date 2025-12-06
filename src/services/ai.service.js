// src/services/ai.service.js
import OpenAI from "openai";
import config from "../config/env.js";

const openai = new OpenAI({
  apiKey: config.openAiApiKey,
});

/**
 * Calls OpenAI Chat Completions using the given conversation history.
 */
export async function getAiReply(messages) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 150,
    temperature: 0.7,
  });

  return completion.choices[0].message.content.trim();
}

/**
 * Simple test helper used by GET /test/openai.
 */
export async function testOpenAi() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Say only: AURAVOICE TEST OK" },
    ],
    max_tokens: 20,
  });

  return completion.choices[0].message.content;
}
