// src/controllers/test.controller.js

/**
 * GET /test/openai
 * Simple endpoint to verify OpenAI connectivity from the browser.
 */

export const openAiTest = async (req, res) => {
  try {
    const reply = await testOpenAi();
    res.send(`OpenAI reply: ${reply}`);
  } catch (err) {
    console.error("OpenAI test error:", err);
    const msg =
      err.response?.data?.error?.message || err.message || "Unknown error";
    res.status(500).send("OpenAI error: " + msg);
  }
};
