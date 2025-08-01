import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { botConfig } from "../config/bot.js";

import type { TweetData } from "./database.js";

// Unified AI Analysis structure - matches main project
interface ProjectImpact {
  relevance_score: number; // 0-10
  description: string;
  opportunities: string;
  threats: string;
}

interface ThreadMetrics {
  total_replies: number;
  max_depth: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  key_reactions: string[];
  community_pulse: string;
  controversial_points: string[];
  consensus_areas: string[];
  disagreement_areas: string[];
}

interface AIAnalysis {
  type: "single" | "thread";
  simple: {
    title: string;
    summary: string;
    viewpoints?: string; // Main viewpoints (only for threads)
    terms?: string; // Key terms explained (if any)
    why_matters: string;
  };
  expert: {
    summary: string;
    impact_level: "low" | "medium" | "high";
    project_impact: ProjectImpact;
  };
  thread_data?: ThreadMetrics; // Only present for threads
}

export class MessageFormatter {
  private language: "ru" | "en";
  private messageFormat: "brief" | "detailed";

  constructor() {
    this.language = botConfig.monitoring.language;
    this.messageFormat = botConfig.monitoring.messageFormat;
  }

  /**
   * Format a single tweet for Telegram message
   */
  formatTweet(tweet: TweetData): string {
    if (this.messageFormat === "brief") {
      return this.formatBriefTweet(tweet);
    }
    return this.formatDetailedTweet(tweet);
  }

  /**
   * Format multiple tweets in a batch
   */
  formatTweetBatch(tweets: TweetData[]): string[] {
    if (tweets.length === 0) {
      return [];
    }

    // If only one tweet, format it normally
    if (tweets.length === 1) {
      return [this.formatTweet(tweets[0])];
    }

    // For multiple tweets, create a header message and individual tweet messages
    const messages: string[] = [];

    // Header message
    const headerText =
      this.language === "ru"
        ? `🔥 Найдено ${tweets.length} новых релевантных твиттов!`
        : `🔥 Found ${tweets.length} new relevant tweets!`;

    messages.push(headerText);

    // Individual tweet messages
    tweets.forEach((tweet, index) => {
      const tweetMessage = this.formatTweet(tweet);
      // Add numbering for batches
      const numberedMessage = `\n${index + 1}/${
        tweets.length
      }\n${tweetMessage}`;
      messages.push(numberedMessage);
    });

    return messages;
  }

  /**
   * Format brief tweet message with new unified AIAnalysis format
   */
  private formatBriefTweet(tweet: TweetData): string {
    const dateLocale = this.language === "ru" ? ru : enUS;
    const formattedDate = format(
      new Date(tweet.createdAt),
      "dd.MM.yyyy HH:mm",
      {
        locale: dateLocale,
      }
    );

    const categories = this.parseCategories(tweet.categories || "");
    const relevanceScore = tweet.relevanceScore
      ? Math.round(tweet.relevanceScore * 10) / 10
      : "N/A";

    const aiAnalysis = this.parseAIComments(tweet.aiComments || "");
    const isRussianAnalysis = this.isRussianAnalysis(aiAnalysis);

    let briefMessage = "";

    if (this.language === "ru") {
      briefMessage = `🔥 Новый твитт

👤 @${tweet.authorUsername}
📅 ${formattedDate}

📝 ${this.truncateText(tweet.content, 200)}`;

      // Add translation for Russian analysis
      if (
        tweet.translation &&
        tweet.translation !== tweet.content &&
        isRussianAnalysis
      ) {
        briefMessage += `\n\n🌐 Перевод:
${this.truncateText(tweet.translation, 150)}`;
      }

      // Add simple explanation if available
      if (aiAnalysis?.simple?.title) {
        briefMessage += `\n\n💭 Суть: ${this.truncateText(
          aiAnalysis.simple.title,
          150
        )}`;
      }

      // Add brief thread analysis if available
      if (aiAnalysis?.type === "thread" && aiAnalysis.thread_data) {
        const threadData = aiAnalysis.thread_data;
        briefMessage += `\n\n🧵 Тред: ${threadData.total_replies} ответов`;

        if (threadData.community_pulse) {
          briefMessage += ` | ${this.truncateText(
            threadData.community_pulse,
            80
          )}`;
        }
      }

      briefMessage += `\n\n🤖 Релевантность: ${relevanceScore}/1.0`;
      if (aiAnalysis?.type) {
        briefMessage += ` | 📊 ${
          aiAnalysis.type === "thread" ? "Тред" : "Твит"
        }`;
      }
      briefMessage += `\n🏷️ ${categories.join(", ")}

🔗 ${tweet.url}
💾 ${tweet.replies} | 👍 ${tweet.likes} | 🔄 ${tweet.retweets}`;
    } else {
      briefMessage = `🔥 New Tweet

👤 @${tweet.authorUsername}  
📅 ${formattedDate}

📝 ${this.truncateText(tweet.content, 200)}`;

      // Add translation for Russian analysis
      if (
        tweet.translation &&
        tweet.translation !== tweet.content &&
        isRussianAnalysis
      ) {
        briefMessage += `\n\n🌐 Translation:
${this.truncateText(tweet.translation, 150)}`;
      }

      // Add simple explanation if available
      if (aiAnalysis?.simple?.title) {
        briefMessage += `\n\n💭 Main point: ${this.truncateText(
          aiAnalysis.simple.title,
          150
        )}`;
      }

      // Add brief thread analysis if available
      if (aiAnalysis?.type === "thread" && aiAnalysis.thread_data) {
        const threadData = aiAnalysis.thread_data;
        briefMessage += `\n\n🧵 Thread: ${threadData.total_replies} replies`;

        if (threadData.community_pulse) {
          briefMessage += ` | ${this.truncateText(
            threadData.community_pulse,
            80
          )}`;
        }
      }

      briefMessage += `\n\n🤖 Relevance: ${relevanceScore}/1.0`;
      if (aiAnalysis?.type) {
        briefMessage += ` | 📊 ${
          aiAnalysis.type === "thread" ? "Thread" : "Tweet"
        }`;
      }
      briefMessage += `\n🏷️ ${categories.join(", ")}

🔗 ${tweet.url}
💾 ${tweet.replies} | 👍 ${tweet.likes} | 🔄 ${tweet.retweets}`;
    }

    return briefMessage;
  }

  /**
   * Format detailed tweet message with new unified AIAnalysis format
   */
  private formatDetailedTweet(tweet: TweetData): string {
    const dateLocale = this.language === "ru" ? ru : enUS;
    const formattedDate = format(
      new Date(tweet.createdAt),
      "dd.MM.yyyy HH:mm",
      {
        locale: dateLocale,
      }
    );

    const categories = this.parseCategories(tweet.categories || "");
    const relevanceScore = tweet.relevanceScore
      ? Math.round(tweet.relevanceScore * 10) / 10
      : "N/A";
    const aiAnalysis = this.parseAIComments(tweet.aiComments || "");
    const isRussianAnalysis = this.isRussianAnalysis(aiAnalysis);

    let message = "";

    if (this.language === "ru") {
      message = `🔥 Новый релевантный твитт!

👤 @${tweet.authorUsername} (${tweet.authorName})
📅 ${formattedDate}

📝 Оригинал:
${tweet.content}`;

      // Add translation for Russian analysis
      if (
        tweet.translation &&
        tweet.translation !== tweet.content &&
        isRussianAnalysis
      ) {
        message += `\n\n🌐 Перевод:
${tweet.translation}`;
      }

      // Simple explanation section (about the main tweet only)
      if (aiAnalysis?.simple) {
        message += `\n\n🧠 Анализ твита автора:`;
        message += `\n📌 Суть: ${aiAnalysis.simple.title}`;
        message += `\n📄 Краткое содержание: ${aiAnalysis.simple.summary}`;

        if (aiAnalysis.type === "single" && aiAnalysis.simple.terms) {
          message += `\n📚 Термины: ${aiAnalysis.simple.terms}`;
        }

        message += `\n❓ Почему важно: ${aiAnalysis.simple.why_matters}`;
      }

      // Expert analysis section (about the main tweet only)
      if (aiAnalysis?.expert) {
        message += `\n\n🎯 Экспертный анализ твита:`;
        message += `\n📊 Резюме: ${this.truncateText(
          aiAnalysis.expert.summary,
          200
        )}`;
        message += `\n⚡ Уровень воздействия: ${aiAnalysis.expert.impact_level}`;

        if (aiAnalysis.expert.project_impact) {
          const impact = aiAnalysis.expert.project_impact;
          message += `\n🎯 Релевантность: ${impact.relevance_score}/10`;
          message += `\n📈 Возможности: ${this.truncateText(
            impact.opportunities,
            150
          )}`;
          message += `\n⚠️ Угрозы: ${this.truncateText(impact.threats, 150)}`;
        }
      }

      // Thread analysis section (short analysis of other users' reactions)
      if (aiAnalysis?.type === "thread" && aiAnalysis.thread_data) {
        const threadData = aiAnalysis.thread_data;
        message += `\n\n🧵 Реакции в треде (${threadData.total_replies} ответов):`;

        // Community pulse - main reaction summary
        if (threadData.community_pulse) {
          message += `\n🌡️ ${this.truncateText(
            threadData.community_pulse,
            120
          )}`;
        }

        // Sentiment distribution
        const sentiment = threadData.sentiment;
        const totalSentiment =
          sentiment.positive +
          sentiment.negative +
          sentiment.neutral +
          sentiment.mixed;
        if (totalSentiment > 0) {
          message += `\n💭 Настроение: `;
          if (sentiment.positive > totalSentiment * 0.6) {
            message += `😊 В основном позитивное (${sentiment.positive}/${totalSentiment})`;
          } else if (sentiment.negative > totalSentiment * 0.4) {
            message += `😠 Много критики (${sentiment.negative}/${totalSentiment})`;
          } else {
            message += `😊${sentiment.positive} 😠${sentiment.negative} 😐${sentiment.neutral}`;
          }
        }

        // Key controversial points (if any)
        if (
          threadData.controversial_points &&
          threadData.controversial_points.length > 0
        ) {
          message += `\n⚡ Споры: ${this.truncateText(
            threadData.controversial_points.slice(0, 1).join(", "),
            100
          )}`;
        }
      }

      message += `\n\n🤖 Метаданные:
• Релевантность: ${relevanceScore}/1.0
• Тип: ${aiAnalysis?.type === "thread" ? "Тред" : "Твит"}
• Категории: ${categories.join(", ")}`;

      message += `\n\n🔗 Ссылка: ${tweet.url}
💾 Комментариев: ${tweet.replies} | 👍 ${tweet.likes} | 🔄 ${tweet.retweets}`;
    } else {
      message = `🔥 New Relevant Tweet!

👤 @${tweet.authorUsername} (${tweet.authorName})
📅 ${formattedDate}

📝 Original:
${tweet.content}`;

      // Add translation for Russian analysis
      if (
        tweet.translation &&
        tweet.translation !== tweet.content &&
        isRussianAnalysis
      ) {
        message += `\n\n🌐 Translation:
${tweet.translation}`;
      }

      // Simple explanation section (about the main tweet only)
      if (aiAnalysis?.simple) {
        message += `\n\n🧠 Author's Tweet Analysis:`;
        message += `\n📌 Main point: ${aiAnalysis.simple.title}`;
        message += `\n📄 Summary: ${aiAnalysis.simple.summary}`;

        if (aiAnalysis.type === "single" && aiAnalysis.simple.terms) {
          message += `\n📚 Terms explained: ${aiAnalysis.simple.terms}`;
        }

        message += `\n❓ Why it matters: ${aiAnalysis.simple.why_matters}`;
      }

      // Expert analysis section (about the main tweet only)
      if (aiAnalysis?.expert) {
        message += `\n\n🎯 Expert Tweet Analysis:`;
        message += `\n📊 Summary: ${this.truncateText(
          aiAnalysis.expert.summary,
          200
        )}`;
        message += `\n⚡ Impact level: ${aiAnalysis.expert.impact_level}`;

        if (aiAnalysis.expert.project_impact) {
          const impact = aiAnalysis.expert.project_impact;
          message += `\n🎯 Relevance: ${impact.relevance_score}/10`;
          message += `\n📈 Opportunities: ${this.truncateText(
            impact.opportunities,
            150
          )}`;
          message += `\n⚠️ Threats: ${this.truncateText(impact.threats, 150)}`;
        }
      }

      // Thread analysis section (short analysis of other users' reactions)
      if (aiAnalysis?.type === "thread" && aiAnalysis.thread_data) {
        const threadData = aiAnalysis.thread_data;
        message += `\n\n🧵 Thread Reactions (${threadData.total_replies} replies):`;

        // Community pulse - main reaction summary
        if (threadData.community_pulse) {
          message += `\n🌡️ ${this.truncateText(
            threadData.community_pulse,
            120
          )}`;
        }

        // Sentiment distribution
        const sentiment = threadData.sentiment;
        const totalSentiment =
          sentiment.positive +
          sentiment.negative +
          sentiment.neutral +
          sentiment.mixed;
        if (totalSentiment > 0) {
          message += `\n💭 Mood: `;
          if (sentiment.positive > totalSentiment * 0.6) {
            message += `😊 Mostly positive (${sentiment.positive}/${totalSentiment})`;
          } else if (sentiment.negative > totalSentiment * 0.4) {
            message += `😠 Much criticism (${sentiment.negative}/${totalSentiment})`;
          } else {
            message += `😊${sentiment.positive} 😠${sentiment.negative} 😐${sentiment.neutral}`;
          }
        }

        // Key controversial points (if any)
        if (
          threadData.controversial_points &&
          threadData.controversial_points.length > 0
        ) {
          message += `\n⚡ Debates: ${this.truncateText(
            threadData.controversial_points.slice(0, 1).join(", "),
            100
          )}`;
        }
      }

      message += `\n\n🤖 Metadata:
• Relevance: ${relevanceScore}/1.0
• Type: ${aiAnalysis?.type === "thread" ? "Thread" : "Tweet"}
• Categories: ${categories.join(", ")}`;

      message += `\n\n🔗 Link: ${tweet.url}
💾 Comments: ${tweet.replies} | 👍 ${tweet.likes} | 🔄 ${tweet.retweets}`;
    }

    return message;
  }

  /**
   * Format status message for monitoring
   */
  formatStatusMessage(stats: {
    totalTweets: number;
    relevantTweets: number;
    todayTweets: number;
    lastProcessed?: Date;
    isMonitoring: boolean;
  }): string {
    const dateLocale = this.language === "ru" ? ru : enUS;
    const lastProcessedText = stats.lastProcessed
      ? format(stats.lastProcessed, "dd.MM.yyyy HH:mm", { locale: dateLocale })
      : this.language === "ru"
      ? "Никогда"
      : "Never";

    const monitoringStatus = stats.isMonitoring
      ? this.language === "ru"
        ? "🟢 Активен"
        : "🟢 Active"
      : this.language === "ru"
      ? "🔴 Остановлен"
      : "🔴 Stopped";

    if (this.language === "ru") {
      return `📊 Статус мониторинга

🤖 Состояние: ${monitoringStatus}
⏰ Интервал: каждые ${botConfig.monitoring.intervalMinutes} минут

📈 Статистика:
• Всего твиттов: ${stats.totalTweets}
• Релевантных: ${stats.relevantTweets}
• Сегодня: ${stats.todayTweets}

🕐 Последний анализ: ${lastProcessedText}

ℹ️ Используйте /monitor start|stop для управления`;
    } else {
      return `📊 Monitoring Status

🤖 Status: ${monitoringStatus}
⏰ Interval: every ${botConfig.monitoring.intervalMinutes} minutes

📈 Statistics:
• Total tweets: ${stats.totalTweets}
• Relevant: ${stats.relevantTweets}
• Today: ${stats.todayTweets}

🕐 Last processed: ${lastProcessedText}

ℹ️ Use /monitor start|stop to control`;
    }
  }

  /**
   * Parse categories from JSON string
   */
  private parseCategories(categoriesJson?: string): string[] {
    if (!categoriesJson) return [];

    try {
      const categories = JSON.parse(categoriesJson);
      return Array.isArray(categories) ? categories : [];
    } catch {
      return [];
    }
  }

  /**
   * Parse AI comments from JSON string
   */
  private parseAIComments(aiCommentsJson?: string): AIAnalysis | null {
    if (!aiCommentsJson) return null;

    try {
      return JSON.parse(aiCommentsJson) as AIAnalysis;
    } catch {
      return null;
    }
  }

  /**
   * Check if analysis was done in Russian (by detecting Cyrillic in title)
   */
  private isRussianAnalysis(aiAnalysis: AIAnalysis | null): boolean {
    return aiAnalysis?.simple?.title
      ? /[а-яё]/i.test(aiAnalysis.simple.title)
      : false;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}

export const messageFormatter = new MessageFormatter();
