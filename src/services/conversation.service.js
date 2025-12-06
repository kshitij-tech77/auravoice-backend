// src/services/conversation.service.js

// In-memory conversation store: CallSid -> array of messages
// NOTE: This resets when the server restarts. For production, use Redis or a database.
const conversations = new Map();

const SYSTEM_PROMPT =
  "You are a warm, concise phone assistant for a restaurant called Everest Grill and Wrap in San Bernardino, California. " +
  "You sound like a real human. Keep replies short, one or two sentences. " +
  "You can answer about hours, location, popular dishes, and basic menu questions. " +
  "If something is impossible on this call, say it kindly.";

/**
 * Ensure a conversation exists for this callSid and return it.
 */
export function getOrCreateConversation(callSid) {
  if (!conversations.has(callSid)) {
    conversations.set(callSid, [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ]);
  }
  return conversations.get(callSid);
}

/**
 * Add a user message to this call's conversation.
 */
export function addUserMessage(callSid, content) {
  const messages = getOrCreateConversation(callSid);
  messages.push({ role: "user", content });
}

/**
 * Add an assistant message to this call's conversation.
 */
export function addAssistantMessage(callSid, content) {
  const messages = getOrCreateConversation(callSid);
  messages.push({ role: "assistant", content });
}

/**
 * Get the full message history for this call.
 */
export function getMessages(callSid) {
  return getOrCreateConversation(callSid);
}
