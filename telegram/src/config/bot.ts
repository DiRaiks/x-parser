import { config } from "dotenv";

// Load environment variables
config({ path: ".env" });

export interface BotConfig {
  telegram: {
    botToken: string;
    chatId: string;
    adminId: string;
  };
  twitter: {
    authToken: string;
    csrfToken: string;
  };
  openai: {
    apiKey: string;
  };
  database: {
    url: string;
  };
  monitoring: {
    intervalMinutes: number;
    messageFormat: "brief" | "detailed";
    language: "ru" | "en";
  };
}

export const botConfig: BotConfig = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    adminId: process.env.TELEGRAM_ADMIN_ID || "",
  },
  twitter: {
    authToken: process.env.TWITTER_AUTH_TOKEN || "",
    csrfToken: process.env.TWITTER_CSRF_TOKEN || "",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
  },
  database: {
    url: process.env.DATABASE_URL || "file:../prisma/dev.db",
  },
  monitoring: {
    intervalMinutes: parseInt(
      process.env.BOT_MONITORING_INTERVAL_MINUTES || "30"
    ),
    messageFormat:
      (process.env.BOT_MESSAGE_FORMAT as "brief" | "detailed") || "detailed",
    language: (process.env.BOT_LANGUAGE as "ru" | "en") || "ru",
  },
};

// Validate required configuration
export function validateConfig(): void {
  const required = {
    TELEGRAM_BOT_TOKEN: botConfig.telegram.botToken,
    TELEGRAM_CHAT_ID: botConfig.telegram.chatId,
    TELEGRAM_ADMIN_ID: botConfig.telegram.adminId,
    TWITTER_AUTH_TOKEN: botConfig.twitter.authToken,
    TWITTER_CSRF_TOKEN: botConfig.twitter.csrfToken,
    OPENAI_API_KEY: botConfig.openai.apiKey,
  };

  const missing = Object.entries(required).filter(([, value]) => !value);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach(([key]) => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log("✅ Bot configuration validated successfully");
}
