import { Telegraf } from "telegraf";
import { botConfig } from "../config/bot.js";
import { messageFormatter } from "./message-formatter.js";
import { TweetData, databaseService } from "./database.js";

export class BotNotificationService {
  private bot: Telegraf;
  private chatId: string;

  constructor(bot: Telegraf) {
    this.bot = bot;
    this.chatId = botConfig.telegram.chatId;
  }

  /**
   * Send a batch of tweets to the chat
   */
  async sendTweetBatch(tweets: TweetData[]): Promise<void> {
    if (tweets.length === 0) {
      console.log("📭 No tweets to send");
      return;
    }

    try {
      console.log(`📤 Sending ${tweets.length} tweets to chat ${this.chatId}`);

      const messages = messageFormatter.formatTweetBatch(tweets);

      // Send messages with delay to avoid rate limits
      for (const message of messages) {
        try {
          await this.bot.telegram.sendMessage(this.chatId, message, {
            parse_mode: "HTML",
          });

          // Delay between messages to avoid spam
          if (messages.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error("❌ Error sending message:", error);

          // If message is too long, try to send truncated version
          if (String(error).includes("message is too long")) {
            const truncatedMessage = this.truncateMessage(message);
            try {
              await this.bot.telegram.sendMessage(
                this.chatId,
                truncatedMessage,
                {
                  parse_mode: "HTML",
                }
              );
            } catch (truncError) {
              console.error("❌ Error sending truncated message:", truncError);
            }
          }
        }
      }

      console.log("✅ All messages sent successfully");

      // Mark tweets as sent in database
      const tweetIds = tweets.map((tweet) => tweet.tweetId);
      await databaseService.markTweetsAsSent(tweetIds);
    } catch (error) {
      console.error("❌ Error sending tweet batch:", error);
      throw error;
    }
  }

  /**
   * Send a single tweet
   */
  async sendTweet(tweet: TweetData): Promise<void> {
    await this.sendTweetBatch([tweet]);
  }

  /**
   * Send a simple text message
   */
  async sendMessage(text: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(this.chatId, text);
      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  }

  /**
   * Send notification about monitoring errors
   */
  async sendErrorNotification(error: string): Promise<void> {
    const lang = botConfig.monitoring.language;
    const errorMessage =
      lang === "ru"
        ? `⚠️ Ошибка мониторинга:\n\n${error}`
        : `⚠️ Monitoring error:\n\n${error}`;

    try {
      await this.sendMessage(errorMessage);
    } catch (sendError) {
      console.error("❌ Failed to send error notification:", sendError);
    }
  }

  /**
   * Send startup notification
   */
  async sendStartupNotification(): Promise<void> {
    const lang = botConfig.monitoring.language;
    const message =
      lang === "ru"
        ? `🚀 Бот запущен и готов к работе!

🔧 Настройки:
• Интервал мониторинга: ${botConfig.monitoring.intervalMinutes} минут
• Язык анализа: ${botConfig.monitoring.language}
• Формат сообщений: ${botConfig.monitoring.messageFormat}

ℹ️ Используйте /status для проверки состояния`
        : `🚀 Bot started and ready!

🔧 Settings:
• Monitoring interval: ${botConfig.monitoring.intervalMinutes} minutes
• Analysis language: ${botConfig.monitoring.language}
• Message format: ${botConfig.monitoring.messageFormat}

ℹ️ Use /status to check status`;

    try {
      await this.sendMessage(message);
    } catch (error) {
      console.error("❌ Failed to send startup notification:", error);
    }
  }

  /**
   * Truncate message if it's too long for Telegram
   */
  private truncateMessage(message: string): string {
    const maxLength = 4000; // Telegram limit is 4096, leave some margin

    if (message.length <= maxLength) {
      return message;
    }

    const truncated = message.substring(0, maxLength - 100);
    const lang = botConfig.monitoring.language;
    const suffix =
      lang === "ru"
        ? "\n\n... (сообщение обрезано из-за ограничения длины)"
        : "\n\n... (message truncated due to length limit)";

    return truncated + suffix;
  }

  /**
   * Check if chat is accessible
   */
  async checkChatAccess(): Promise<boolean> {
    try {
      await this.bot.telegram.getChat(this.chatId);
      return true;
    } catch (error) {
      console.error("❌ Chat access check failed:", error);
      return false;
    }
  }
}

// Will be initialized in main bot file
export let botNotificationService: BotNotificationService;
