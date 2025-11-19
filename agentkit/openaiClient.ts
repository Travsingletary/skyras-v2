import OpenAI from "openai";

/**
 * Centralized OpenAI client instance for the AgentKit layer. Actual agent
 * executions can import this to run tool-calling or planning prompts.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type OpenAIClient = typeof openai;
