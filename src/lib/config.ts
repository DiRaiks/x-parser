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
    en: 'Create a brief summary of the given tweet (1-2 sentences) and provide expert commentary on the significance of this information for the crypto community.\n\nAnalyze the tweet content and evaluate its relevance to blockchain and crypto projects.\n\nRespond in JSON format:\n{\n  "summary": "brief summary",\n  "expert_comment": "expert commentary on significance",\n  "impact_level": "low|medium|high",\n  "project_impact": {\n    "relevance_to_project": "relevance to crypto projects (0-10 score): explain connection",\n    "main_tweet_impact": "potential impact on blockchain projects or protocols",\n    "comments_impact": "not applicable for single tweet",\n    "overall_impact": "overall impact: opportunities, threats, market implications",\n    "opportunities": "specific opportunities for adoption or development",\n    "threats": "potential threats or risks to consider"\n  }\n}',
    ru: 'Create a brief summary of the given tweet (1-2 sentences) and provide expert commentary on the significance of this information for the crypto community.\n\nAnalyze the tweet content and evaluate its relevance to blockchain and crypto projects.\n\nRespond in Russian.\n\nRespond in JSON format:\n{\n  "summary": "краткое саммари",\n  "expert_comment": "экспертный комментарий о значимости",\n  "impact_level": "low|medium|high",\n  "project_impact": {\n    "relevance_to_project": "оценка релевантности для крипто проектов (0-10): объясни связь",\n    "main_tweet_impact": "потенциальное влияние на блокчейн проекты или протоколы",\n    "comments_impact": "не применимо для одиночного твита",\n    "overall_impact": "общее влияние: возможности, угрозы, рыночные последствия",\n    "opportunities": "конкретные возможности для внедрения или развития",\n    "threats": "потенциальные угрозы или риски для рассмотрения"\n  }\n}',
  },

  thread_analyzer: {
    en: 'Analyze this Twitter thread including the main tweet and replies. Provide comprehensive analysis in English.\n\nAnalyze the thread content and evaluate its relevance to blockchain and crypto projects.\n\nSENTIMENT ANALYSIS INSTRUCTIONS:\n- Analyze EVERY comment/reply in the thread for sentiment\n- Count each comment only once, even if it appears in nested discussions\n- Classify sentiment as: positive (supportive, optimistic), negative (critical, pessimistic), neutral (factual, indifferent), or mixed (contains both positive and negative elements)\n- Ensure the sum of positive + negative + neutral + mixed equals the total number of comments analyzed\n- If you cannot analyze a comment due to content issues, classify it as neutral\n\nReturn JSON in this exact format:\n{\n  "thread_summary": "brief description of the entire discussion",\n  "main_tweet_analysis": "analysis of the main tweet",\n  "comment_sentiment": {\n    "positive": 0,\n    "negative": 0,\n    "neutral": 0,\n    "mixed": 0\n  },\n  "key_reactions": ["reaction1", "reaction2"],\n  "trending_topics": ["topic1", "topic2"],\n  "community_pulse": "overall community mood",\n  "controversial_points": ["controversial point"],\n  "reply_chains": [{"depth": 1, "participant_count": 10, "main_topic": "topic", "sentiment": "sentiment"}],\n  "influencer_engagement": [{"username": "name", "follower_tier": "high/medium/low", "sentiment": "sentiment", "reply_count": 1}],\n  "discussion_patterns": {"debate_intensity": 5, "echo_chamber_score": 5, "new_information_score": 5},\n  "nested_discussion_summary": "analysis of multi-level discussions",\n  "key_debate_points": ["key debate point"],\n  "consensus_areas": ["area of consensus"],\n  "disagreement_areas": ["area of disagreement"],\n  "impact_assessment": "low/medium/high",\n  "project_impact": {\n    "relevance_to_project": "relevance to crypto projects (0-10 score): explain connection",\n    "main_tweet_impact": "potential impact on blockchain projects or protocols",\n    "comments_impact": "how comments enhance opportunities analysis",\n    "overall_impact": "overall impact: opportunities, threats, market implications",\n    "opportunities": "specific opportunities for adoption or development",\n    "threats": "potential threats or risks to consider"\n  }\n}',
    ru: 'Analyze this Twitter thread including the main tweet and replies. Provide comprehensive analysis in Russian.\n\nAnalyze the thread content and evaluate its relevance to blockchain and crypto projects.\n\nSENTIMENT ANALYSIS INSTRUCTIONS:\n- Analyze EVERY comment/reply in the thread for sentiment\n- Count each comment only once, even if it appears in nested discussions\n- Classify sentiment as: positive (supportive, optimistic), negative (critical, pessimistic), neutral (factual, indifferent), or mixed (contains both positive and negative elements)\n- Ensure the sum of positive + negative + neutral + mixed equals the total number of comments analyzed\n- If you cannot analyze a comment due to content issues, classify it as neutral\n\nReturn JSON in this exact format:\n{\n  "thread_summary": "краткое описание всей дискуссии",\n  "main_tweet_analysis": "анализ основного твита",\n  "comment_sentiment": {\n    "positive": 0,\n    "negative": 0,\n    "neutral": 0,\n    "mixed": 0\n  },\n  "key_reactions": ["реакция1", "реакция2"],\n  "trending_topics": ["тема1", "тема2"],\n  "community_pulse": "общее настроение",\n  "controversial_points": ["спорный момент"],\n  "reply_chains": [{"depth": 1, "participant_count": 10, "main_topic": "тема", "sentiment": "настроение"}],\n  "influencer_engagement": [{"username": "имя", "follower_tier": "high/medium/low", "sentiment": "настроение", "reply_count": 1}],\n  "discussion_patterns": {"debate_intensity": 5, "echo_chamber_score": 5, "new_information_score": 5},\n  "nested_discussion_summary": "анализ многоуровневых обсуждений",\n  "key_debate_points": ["ключевая точка спора"],\n  "consensus_areas": ["область консенсуса"],\n  "disagreement_areas": ["область разногласий"],\n  "impact_assessment": "low/medium/high",\n  "project_impact": {\n    "relevance_to_project": "оценка релевантности для крипто проектов (0-10): объясни связь",\n    "main_tweet_impact": "потенциальное влияние на блокчейн проекты или протоколы",\n    "comments_impact": "как комментарии дополняют анализ возможностей",\n    "overall_impact": "общее влияние: возможности, угрозы, рыночные последствия",\n    "opportunities": "конкретные возможности для внедрения или развития",\n    "threats": "потенциальные угрозы или риски для рассмотрения"\n  }\n}',
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

// Force reload prompts config
export function reloadPromptsConfig(): PromptsConfig {
  promptsConfigCache = null;
  return getPromptsConfig();
}
