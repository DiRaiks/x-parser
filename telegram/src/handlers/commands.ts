import { Context } from "telegraf";
import { botConfig } from "../config/bot.js";
import { databaseService } from "../services/database.js";
import { messageFormatter } from "../services/message-formatter.js";
import { twitterMonitorService } from "../services/twitter-monitor.js";

/**
 * Check if user is admin
 */
function isAdmin(ctx: Context): boolean {
  const userId = ctx.from?.id.toString();
  return userId === botConfig.telegram.adminId;
}

/**
 * Admin middleware
 */
export function adminOnly() {
  return (ctx: Context, next: () => Promise<void>) => {
    if (!isAdmin(ctx)) {
      const lang = botConfig.monitoring.language;
      const message =
        lang === "ru"
          ? "❌ У вас нет прав для выполнения этой команды"
          : "❌ You do not have permission to execute this command";
      return ctx.reply(message);
    }
    return next();
  };
}

/**
 * Start command handler
 */
export async function startCommand(ctx: Context) {
  const lang = botConfig.monitoring.language;

  if (lang === "ru") {
    const message = `🤖 Привет! Я бот для мониторинга Twitter с AI анализом.

📋 Доступные команды:
/status - Статус мониторинга и статистика
/monitor start - Запустить мониторинг
/monitor stop - Остановить мониторинг
/fetch - Запустить парсинг новых твиттов сейчас
/analyze <url> - Проанализировать твитт
/reset - Сбросить состояние мониторинга

💡 Новые возможности AI анализа:
• Простое объяснение смысла твитта
• Объяснение того, что хотел сказать автор
• Расшифровка сложных терминов
• Анализ авторских тредов (цепочек твиттов)
• Экспертный анализ для проекта

🔧 Настройки:
• Интервал: каждые ${botConfig.monitoring.intervalMinutes} минут
• Язык анализа: ${botConfig.monitoring.language}
• Формат сообщений: ${botConfig.monitoring.messageFormat}

ℹ️ Бот автоматически мониторит новые релевантные твитты и отправляет их в этот чат с полным анализом.`;

    await ctx.reply(message);
  } else {
    const message = `🤖 Hello! I'm a Twitter monitoring bot with AI analysis.

📋 Available commands:
/status - Monitoring status and statistics
/monitor start - Start monitoring
/monitor stop - Stop monitoring
/fetch - Fetch new tweets now
/analyze <url> - Analyze a tweet
/reset - Reset monitoring state

💡 New AI analysis features:
• Simple explanation of tweet meaning
• What the author was trying to say
• Complex terms explained simply
• Analysis of author thread chains
• Expert analysis for the project

🔧 Settings:
• Interval: every ${botConfig.monitoring.intervalMinutes} minutes
• Analysis language: ${botConfig.monitoring.language}
• Message format: ${botConfig.monitoring.messageFormat}

ℹ️ Bot automatically monitors new relevant tweets and sends them to this chat with full analysis.`;

    await ctx.reply(message);
  }
}

/**
 * Status command handler
 */
export async function statusCommand(ctx: Context) {
  try {
    // Get monitoring status
    const monitoringState = twitterMonitorService.getStatus();

    // Get database stats
    const dbStats = await databaseService.getMonitoringStats();

    // Check database connection
    const dbConnected = await databaseService.checkConnection();

    const stats = {
      ...dbStats,
      isMonitoring: monitoringState.isRunning,
    };

    const statusMessage = messageFormatter.formatStatusMessage(stats);

    // Add technical info
    const lang = botConfig.monitoring.language;
    const dbStatus = dbConnected
      ? lang === "ru"
        ? "🟢 Подключена"
        : "🟢 Connected"
      : lang === "ru"
      ? "🔴 Ошибка подключения"
      : "🔴 Connection error";

    const lastCheck = monitoringState.lastCheck
      ? monitoringState.lastCheck.toLocaleString()
      : lang === "ru"
      ? "Никогда"
      : "Never";

    const technicalInfo =
      lang === "ru"
        ? `\n\n🔧 Техническая информация:
• База данных: ${dbStatus}
• Последняя проверка: ${lastCheck}
• Всего проверок: ${monitoringState.stats.totalChecks}
• Отправлено твиттов: ${monitoringState.stats.totalTweetsSent}`
        : `\n\n🔧 Technical information:
• Database: ${dbStatus}
• Last check: ${lastCheck}
• Total checks: ${monitoringState.stats.totalChecks}
• Tweets sent: ${monitoringState.stats.totalTweetsSent}`;

    await ctx.reply(statusMessage + technicalInfo);
  } catch (error) {
    console.error("Error in status command:", error);
    const lang = botConfig.monitoring.language;
    const errorMessage =
      lang === "ru"
        ? "❌ Ошибка при получении статуса"
        : "❌ Error getting status";
    await ctx.reply(errorMessage);
  }
}

/**
 * Monitor command handler
 */
export async function monitorCommand(ctx: Context) {
  const args =
    ctx.message && "text" in ctx.message
      ? ctx.message.text.split(" ").slice(1)
      : [];

  const action = args[0]?.toLowerCase();
  const lang = botConfig.monitoring.language;

  if (!action || !["start", "stop"].includes(action)) {
    const helpMessage =
      lang === "ru"
        ? "❓ Использование: /monitor start|stop"
        : "❓ Usage: /monitor start|stop";
    return ctx.reply(helpMessage);
  }

  try {
    if (action === "start") {
      const started = twitterMonitorService.start();
      if (started) {
        const message =
          lang === "ru"
            ? `✅ Мониторинг запущен!
          
🔄 Проверка каждые ${botConfig.monitoring.intervalMinutes} минут
📊 Первая проверка через 30 секунд`
            : `✅ Monitoring started!
          
🔄 Checking every ${botConfig.monitoring.intervalMinutes} minutes  
📊 First check in 30 seconds`;
        await ctx.reply(message);
      } else {
        const message =
          lang === "ru"
            ? "❌ Не удалось запустить мониторинг"
            : "❌ Failed to start monitoring";
        await ctx.reply(message);
      }
    } else {
      twitterMonitorService.stop();
      const message =
        lang === "ru" ? "🛑 Мониторинг остановлен" : "🛑 Monitoring stopped";
      await ctx.reply(message);
    }
  } catch (error) {
    console.error("Error in monitor command:", error);
    const errorMessage =
      lang === "ru"
        ? "❌ Ошибка при управлении мониторингом"
        : "❌ Error controlling monitoring";
    await ctx.reply(errorMessage);
  }
}

/**
 * Fetch command handler - manually trigger tweet parsing
 */
export async function fetchCommand(ctx: Context) {
  const lang = botConfig.monitoring.language;

  try {
    const fetchingMessage =
      lang === "ru"
        ? "🔄 Запускаю парсинг новых твиттов..."
        : "🔄 Fetching new tweets...";

    await ctx.reply(fetchingMessage);

    // Run full monitoring cycle
    const progressMessage =
      lang === "ru"
        ? "📡 Подключаюсь к Twitter и проверяю новые твитты..."
        : "📡 Connecting to Twitter and checking for new tweets...";

    try {
      await ctx.editMessageText(progressMessage);
    } catch {
      await ctx.reply(progressMessage);
    }

    const newTweets = await twitterMonitorService.runFullMonitoringCycle();

    if (newTweets.length > 0) {
      const successMessage =
        lang === "ru"
          ? `✅ Найдено ${newTweets.length} новых релевантных твиттов! Отправляю...`
          : `✅ Found ${newTweets.length} new relevant tweets! Sending...`;

      try {
        await ctx.editMessageText(successMessage);
      } catch {
        await ctx.reply(successMessage);
      }

      // Import notification service
      const { BotNotificationService } = await import(
        "../services/bot-notification.js"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockBot = { telegram: ctx.telegram } as any;
      const notificationService = new BotNotificationService(mockBot);
      await notificationService.sendTweetBatch(newTweets);

      const completedMessage =
        lang === "ru"
          ? `🎉 Готово! Отправлено ${newTweets.length} твиттов в чат.`
          : `🎉 Done! Sent ${newTweets.length} tweets to chat.`;

      setTimeout(async () => {
        try {
          await ctx.editMessageText(completedMessage);
        } catch {
          await ctx.reply(completedMessage);
        }
      }, 2000);
    } else {
      const noTweetsMessage =
        lang === "ru"
          ? "📭 Новых релевантных твиттов не найдено."
          : "📭 No new relevant tweets found.";

      try {
        await ctx.editMessageText(noTweetsMessage);
      } catch {
        await ctx.reply(noTweetsMessage);
      }
    }
  } catch (error) {
    console.error("Error in fetch command:", error);
    const errorMessage =
      lang === "ru"
        ? `❌ Ошибка при парсинге: ${String(error).slice(0, 100)}...`
        : `❌ Error fetching tweets: ${String(error).slice(0, 100)}...`;

    try {
      await ctx.editMessageText(errorMessage);
    } catch {
      await ctx.reply(errorMessage);
    }
  }
}

/**
 * Reset command handler - reset monitoring state
 */
export async function resetCommand(ctx: Context) {
  const lang = botConfig.monitoring.language;

  try {
    // Reset monitoring state
    twitterMonitorService.resetState();

    const successMessage =
      lang === "ru"
        ? "✅ Состояние мониторинга сброшено. Теперь /fetch найдет все неотправленные твиты."
        : "✅ Monitoring state reset. Now /fetch will find all unsent tweets.";

    await ctx.reply(successMessage);
  } catch (error) {
    console.error("Error in reset command:", error);
    const errorMessage =
      lang === "ru"
        ? `❌ Ошибка при сбросе: ${String(error).slice(0, 100)}...`
        : `❌ Error resetting state: ${String(error).slice(0, 100)}...`;

    await ctx.reply(errorMessage);
  }
}

/**
 * Analyze command handler
 */
export async function analyzeCommand(ctx: Context) {
  const args =
    ctx.message && "text" in ctx.message
      ? ctx.message.text.split(" ").slice(1)
      : [];

  const url = args[0];
  const lang = botConfig.monitoring.language;

  if (!url) {
    const helpMessage =
      lang === "ru"
        ? "❓ Использование: /analyze <twitter_url>\n\nПример: /analyze https://twitter.com/user/status/123"
        : "❓ Usage: /analyze <twitter_url>\n\nExample: /analyze https://twitter.com/user/status/123";
    return ctx.reply(helpMessage);
  }

  // Validate Twitter URL
  if (!url.includes("twitter.com") && !url.includes("x.com")) {
    const errorMessage =
      lang === "ru"
        ? "❌ Пожалуйста, укажите корректную ссылку на Twitter"
        : "❌ Please provide a valid Twitter URL";
    return ctx.reply(errorMessage);
  }

  try {
    const processingMessage =
      lang === "ru" ? "⏳ Анализирую твитт..." : "⏳ Analyzing tweet...";
    await ctx.reply(processingMessage);

    // Extract tweet ID from URL
    const tweetIdMatch = url.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
      const errorMessage =
        lang === "ru"
          ? "❌ Не удалось извлечь ID твитта из URL"
          : "❌ Could not extract tweet ID from URL";
      try {
        return ctx.editMessageText(errorMessage);
      } catch {
        return ctx.reply(errorMessage);
      }
    }

    const tweetId = tweetIdMatch[1];

    // Check if tweet exists in database
    const tweet = await databaseService.getTweetById(tweetId);

    if (!tweet) {
      // Tweet not in database, need to parse it first
      const parseMessage =
        lang === "ru"
          ? "🔍 Твитт не найден в базе, парсю..."
          : "🔍 Tweet not found in database, parsing...";

      try {
        await ctx.editMessageText(parseMessage);
      } catch {
        await ctx.reply(parseMessage);
      }

      // This would require calling the main app's parser API
      // For now, return error
      const errorMessage =
        lang === "ru"
          ? "❌ Твитт не найден в базе данных. Добавьте его через основное приложение сначала."
          : "❌ Tweet not found in database. Please add it through the main application first.";

      try {
        return ctx.editMessageText(errorMessage);
      } catch {
        return ctx.reply(errorMessage);
      }
    }

    // Format and send tweet analysis
    const formattedMessage = messageFormatter.formatTweet(tweet);
    try {
      await ctx.editMessageText(formattedMessage);
    } catch {
      // If editing fails, send as new message
      await ctx.reply(formattedMessage);
    }
  } catch (error) {
    console.error("Error in analyze command:", error);
    const errorMessage =
      lang === "ru"
        ? "❌ Ошибка при анализе твитта"
        : "❌ Error analyzing tweet";
    await ctx.reply(errorMessage);
  }
}
