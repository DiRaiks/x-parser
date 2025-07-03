import OpenAI from "openai";
import { getOpenAIConfig, getPrompt } from "./config";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

// Get prompts from configuration
export const getSystemPrompts = () => {
  return {
    RELEVANCE_CHECKER: getPrompt("relevance_checker"),
    TRANSLATOR: (targetLang: string = "en") =>
      getPrompt("translator", targetLang),
    SUMMARIZER: (targetLang: string = "en") =>
      getPrompt("summarizer", targetLang),
    THREAD_ANALYZER: (targetLang: string = "en") =>
      getPrompt("thread_analyzer", targetLang),
  };
};

// Legacy export for backward compatibility
export const SYSTEM_PROMPTS = {
  get RELEVANCE_CHECKER() {
    return getPrompt("relevance_checker");
  },
  TRANSLATOR: (targetLang: string = "en") =>
    getPrompt("translator", targetLang),
  SUMMARIZER: (targetLang: string = "en") =>
    getPrompt("summarizer", targetLang),
  THREAD_ANALYZER: (targetLang: string = "en") =>
    getPrompt("thread_analyzer", targetLang),
};

// Helper function to create OpenAI completion with config
export async function createCompletion(
  systemPrompt: string,
  userContent: string,
  type: "relevance" | "translation" | "summary" | "thread_analysis" = "summary"
) {
  const config = getOpenAIConfig();

  return await openai.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: config.temperatures[type],
    max_tokens: config.max_tokens,
  });
}
