#!/usr/bin/env node

import { Telegraf } from "telegraf";
import cron from "node-cron";
import { validateConfig, botConfig } from "./config/bot.js";
import { databaseService } from "./services/database.js";
import { twitterMonitorService } from "./services/twitter-monitor.js";
import { BotNotificationService } from "./services/bot-notification.js";
import {
  startCommand,
  statusCommand,
  monitorCommand,
  analyzeCommand,
  fetchCommand,
  resetCommand,
  adminOnly,
} from "./handlers/commands.js";

// Global error handling
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

class TelegramBot {
  private bot: Telegraf;
  private notificationService: BotNotificationService;
  private monitoringCron: cron.ScheduledTask | null = null;

  constructor() {
    // Validate configuration first
    validateConfig();

    // Initialize bot
    this.bot = new Telegraf(botConfig.telegram.botToken);
    this.notificationService = new BotNotificationService(this.bot);

    this.setupCommands();
    this.setupMiddleware();
    this.setupMonitoring();
  }

  /**
   * Setup bot commands
   */
  private setupCommands(): void {
    console.log("⚙️ Setting up bot commands...");

    // Public commands
    this.bot.command("start", startCommand);

    // Admin-only commands
    this.bot.command("status", adminOnly(), statusCommand);
    this.bot.command("monitor", adminOnly(), monitorCommand);
    this.bot.command("analyze", adminOnly(), analyzeCommand);
    this.bot.command("fetch", adminOnly(), fetchCommand);
    this.bot.command("reset", adminOnly(), resetCommand);

    // Help command
    this.bot.command("help", startCommand);

    console.log("✅ Bot commands configured");
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Log all messages for debugging
    this.bot.use((ctx, next) => {
      const user = ctx.from;
      const message =
        ctx.message && "text" in ctx.message ? ctx.message.text : "non-text";
      console.log(`📨 Message from ${user?.username || user?.id}: ${message}`);
      return next();
    });

    // Handle unknown commands
    this.bot.on("text", (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith("/")) {
        const lang = botConfig.monitoring.language;
        const unknownCommand =
          lang === "ru"
            ? "❓ Неизвестная команда. Используйте /start для списка доступных команд."
            : "❓ Unknown command. Use /start for available commands.";
        ctx.reply(unknownCommand);
      }
    });
  }

  /**
   * Setup monitoring with cron jobs
   */
  private setupMonitoring(): void {
    console.log("⏰ Setting up monitoring cron job...");

    // Create cron pattern for the specified interval
    const intervalMinutes = botConfig.monitoring.intervalMinutes;
    const cronPattern = `*/${intervalMinutes} * * * *`; // Every N minutes

    this.monitoringCron = cron.schedule(
      cronPattern,
      async () => {
        await this.runMonitoringCheck();
      },
      {
        scheduled: false, // Don't start immediately
      }
    );

    console.log(`✅ Monitoring cron job configured (${cronPattern})`);
  }

  /**
   * Run monitoring check and send notifications
   */
  private async runMonitoringCheck(): Promise<void> {
    try {
      console.log("🔍 Running scheduled monitoring check...");

      // Run full monitoring cycle (auto-monitor + check database)
      const newTweets = await twitterMonitorService.runFullMonitoringCycle();

      if (newTweets.length > 0) {
        console.log(`📤 Sending ${newTweets.length} new tweets...`);
        await this.notificationService.sendTweetBatch(newTweets);
      } else {
        console.log("📭 No new tweets to send");
      }
    } catch (error) {
      console.error("❌ Error in monitoring check:", error);

      // Send error notification to admin
      await this.notificationService.sendErrorNotification(String(error));
    }
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      console.log("🚀 Starting Telegram bot...");

      // Check database connection
      const dbConnected = await databaseService.checkConnection();
      if (!dbConnected) {
        throw new Error("Database connection failed");
      }
      console.log("✅ Database connected");

      // Check chat access
      const chatAccessible = await this.notificationService.checkChatAccess();
      if (!chatAccessible) {
        console.warn(
          "⚠️ Warning: Chat access check failed. Bot may not be able to send messages."
        );
      }

      // Start bot polling
      await this.bot.launch();
      console.log("✅ Bot started successfully");

      // Send startup notification
      await this.notificationService.sendStartupNotification();

      // Start monitoring cron job
      if (this.monitoringCron) {
        this.monitoringCron.start();
        console.log("✅ Monitoring cron job started");
      }

      console.log(`🤖 Bot is running! Chat ID: ${botConfig.telegram.chatId}`);
      console.log("📱 Commands: /start, /status, /monitor, /fetch, /analyze");
    } catch (error) {
      console.error("❌ Failed to start bot:", error);
      process.exit(1);
    }
  }

  /**
   * Stop the bot gracefully
   */
  async stop(): Promise<void> {
    console.log("🛑 Stopping bot...");

    try {
      // Stop monitoring
      if (this.monitoringCron) {
        this.monitoringCron.stop();
        console.log("✅ Monitoring stopped");
      }

      // Stop Twitter monitoring service
      twitterMonitorService.stop();

      // Stop bot
      this.bot.stop();
      console.log("✅ Bot stopped");

      // Disconnect from database
      await databaseService.disconnect();
      console.log("✅ Database disconnected");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }
}

// Main execution
async function main() {
  console.log("🤖 X Parser Telegram Bot");
  console.log("========================");

  const bot = new TelegramBot();

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
    await bot.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Start the bot
  await bot.start();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

export default TelegramBot;
