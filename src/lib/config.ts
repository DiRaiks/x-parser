import { readFileSync } from "fs";
import { join } from "path";

// Types
interface OpenAIConfig {
  model: string;
  temperatures: {
    relevance: number;
    translation: number;
    summary: number;
    thread_analysis: number;
  };
  max_tokens: number;
  timeout: number;
}

interface ParsingConfig {
  max_tweets_per_fetch: number;
  fetch_interval_minutes: number;
  max_retries: number;
  retry_delay_ms: number;
  request_timeout_ms: number;
}

interface AnalysisConfig {
  default_language: string;
  supported_languages: string[];
  batch_size: number;
  auto_analyze: boolean;
}

interface UIConfig {
  tweets_per_page: number;
  max_pages: number;
  auto_refresh_interval_ms: number;
}

interface TwitterConfig {
  rate_limit_delay_ms: number;
}

export interface AppConfig {
  openai: OpenAIConfig;
  parsing: ParsingConfig;
  analysis: AnalysisConfig;
  ui: UIConfig;
  twitter: TwitterConfig;
}

export interface PromptsConfig {
  relevance_checker: string;
  translator: {
    en: string;
    ru: string;
  };
  summarizer: {
    en: string;
    ru: string;
  };
  thread_analyzer: {
    en: string;
    ru: string;
  };
}

// Default configurations (fallback)
const DEFAULT_APP_CONFIG: AppConfig = {
  openai: {
    model: "gpt-4o-mini",
    temperatures: {
      relevance: 0.3,
      translation: 0.1,
      summary: 0.5,
      thread_analysis: 0.4,
    },
    max_tokens: 4000,
    timeout: 60000,
  },
  parsing: {
    max_tweets_per_fetch: 50,
    fetch_interval_minutes: 5,
    max_retries: 3,
    retry_delay_ms: 1000,
    request_timeout_ms: 30000,
  },
  analysis: {
    default_language: "en",
    supported_languages: ["en", "ru"],
    batch_size: 10,
    auto_analyze: true,
  },
  ui: {
    tweets_per_page: 20,
    max_pages: 100,
    auto_refresh_interval_ms: 30000,
  },
  twitter: {
    rate_limit_delay_ms: 2000,
  },
};

const DEFAULT_PROMPTS_CONFIG: PromptsConfig = {
  relevance_checker: `You are a blockchain industry expert analyst. Your task is to determine if a given tweet is suitable for a news feed covering topics: Ethereum, blockchain, wallets, DeFi, NFT, cryptocurrencies, Web3.

Rate the tweet on a scale from 0 to 1, where:
- 1.0 = highly relevant, important news/information
- 0.7-0.9 = relevant, interesting information  
- 0.4-0.6 = partially relevant
- 0.0-0.3 = not relevant

Respond ONLY in JSON format:
{
  "relevance_score": 0.8,
  "is_relevant": true,
  "categories": ["ethereum", "defi"],
  "reason": "brief explanation"
}`,

  translator: {
    en: "Translate the given text from the original language to English. Keep technical crypto terms as they are commonly used. Respond with ONLY the translation without additional comments.",
    ru: "Translate the given text from the original language to Russian. Keep technical terms in the original if commonly used in Russian crypto community. Respond with ONLY the translation without additional comments.",
  },

  summarizer: {
    en: "Create a brief summary of the given tweet (1-2 sentences) and provide expert commentary on the significance of this information for the crypto community. Respond in JSON format with summary, expert_comment, and impact_level fields.",
    ru: "Create a brief summary of the given tweet (1-2 sentences) and provide expert commentary on the significance of this information for the crypto community. Respond in Russian. Respond in JSON format with summary, expert_comment, and impact_level fields.",
  },

  thread_analyzer: {
    en: "Analyze this Twitter thread including the main tweet and replies. Provide comprehensive analysis in English. Return JSON format with analysis fields.",
    ru: "Analyze this Twitter thread including the main tweet and replies. Provide comprehensive analysis in Russian. Return JSON format with analysis fields.",
  },
};

// Cache for loaded configurations
let appConfigCache: AppConfig | null = null;
let promptsConfigCache: PromptsConfig | null = null;

// Helper function to load JSON file safely
function loadJsonFile<T>(filePath: string, defaultConfig: T): T {
  try {
    const fileContent = readFileSync(filePath, "utf8");
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.warn(
      `Failed to load config from ${filePath}, using defaults:`,
      error
    );
    return defaultConfig;
  }
}

// Public API
export function getAppConfig(): AppConfig {
  if (!appConfigCache) {
    const configPath = join(process.cwd(), "config", "app.json");
    appConfigCache = loadJsonFile(configPath, DEFAULT_APP_CONFIG);
  }
  return appConfigCache;
}

export function getPromptsConfig(): PromptsConfig {
  if (!promptsConfigCache) {
    const configPath = join(process.cwd(), "config", "prompts.json");
    promptsConfigCache = loadJsonFile(configPath, DEFAULT_PROMPTS_CONFIG);
  }
  return promptsConfigCache;
}

// Helper functions for specific configurations
export function getOpenAIConfig() {
  return getAppConfig().openai;
}

export function getParsingConfig() {
  return getAppConfig().parsing;
}

export function getAnalysisConfig() {
  return getAppConfig().analysis;
}

export function getUIConfig() {
  return getAppConfig().ui;
}

export function getTwitterConfig() {
  return getAppConfig().twitter;
}

// Prompt helpers
export function getPrompt(
  type: keyof PromptsConfig,
  language?: string
): string {
  const prompts = getPromptsConfig();
  const prompt = prompts[type];

  if (typeof prompt === "string") {
    return prompt;
  }

  if (typeof prompt === "object" && language) {
    const langPrompts = prompt as Record<string, string>;
    return langPrompts[language] || langPrompts["en"] || "";
  }

  return "";
}

// Reset cache (useful for testing)
export function resetConfigCache() {
  appConfigCache = null;
  promptsConfigCache = null;
}
