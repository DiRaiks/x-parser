import { PrismaClient } from "../../../src/generated/prisma/index.js";
import { botConfig } from "../config/bot.js";

export interface TweetData {
  id: string;
  tweetId: string;
  authorUsername: string;
  authorName: string;
  content: string;
  createdAt: Date;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  isRelevant: boolean;
  relevanceScore?: number | null;
  categories?: string | null;
  translation?: string | null;
  summary?: string | null;
  aiComments?: string | null;
  repliesData?: string | null;
  savedAt: Date;
  isFavorite: boolean;
  isProcessed: boolean;
  botSentAt?: Date | null;
}

// Initialize Prisma client with database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: botConfig.database.url,
    },
  },
});

export { prisma };

// Database service for bot operations
export class DatabaseService {
  /**
   * Get new tweets that haven't been sent via bot yet
   * Returns unsent relevant tweets, optionally limited by date
   */
  async getNewTweets(sinceDate?: Date): Promise<TweetData[]> {
    try {
      const whereClause: any = {
        isRelevant: true, // Only relevant tweets
        botSentAt: null, // Only tweets that haven't been sent via bot
      };

      // Only apply date filter if provided and not from the past (system time issues)
      if (sinceDate) {
        const currentTime = new Date();
        const timeDiff = currentTime.getTime() - sinceDate.getTime();
        // Only apply date filter if sinceDate is less than 7 days old
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
          whereClause.savedAt = { gte: sinceDate };
        }
      }

      const tweets = await prisma.tweet.findMany({
        where: whereClause,
        orderBy: {
          savedAt: "desc",
        },
        take: 50, // Limit to avoid spam
      });

      console.log(`Found ${tweets.length} unsent relevant tweets`);
      return tweets;
    } catch (error) {
      console.error("Error fetching new tweets:", error);
      return [];
    }
  }

  /**
   * Get tweet by ID for analysis
   */
  async getTweetById(tweetId: string): Promise<TweetData | null> {
    try {
      return await prisma.tweet.findUnique({
        where: { tweetId },
      });
    } catch (error) {
      console.error("Error fetching tweet by ID:", error);
      return null;
    }
  }

  /**
   * Mark tweets as sent via bot
   */
  async markTweetsAsSent(tweetIds: string[]): Promise<void> {
    try {
      await prisma.tweet.updateMany({
        where: {
          tweetId: {
            in: tweetIds,
          },
        },
        data: {
          botSentAt: new Date(),
        },
      });
      console.log(`✅ Marked ${tweetIds.length} tweets as sent via bot`);
    } catch (error) {
      console.error("Error marking tweets as sent:", error);
    }
  }

  /**
   * Get statistics for monitoring
   */
  async getMonitoringStats(): Promise<{
    totalTweets: number;
    relevantTweets: number;
    todayTweets: number;
    lastProcessed?: Date;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [total, relevant, todayCount, lastTweet] = await Promise.all([
        prisma.tweet.count(),
        prisma.tweet.count({ where: { isRelevant: true } }),
        prisma.tweet.count({
          where: {
            savedAt: { gte: today },
          },
        }),
        prisma.tweet.findFirst({
          orderBy: { savedAt: "desc" },
          select: { savedAt: true },
        }),
      ]);

      return {
        totalTweets: total,
        relevantTweets: relevant,
        todayTweets: todayCount,
        lastProcessed: lastTweet?.savedAt,
      };
    } catch (error) {
      console.error("Error fetching monitoring stats:", error);
      return {
        totalTweets: 0,
        relevantTweets: 0,
        todayTweets: 0,
      };
    }
  }

  /**
   * Check database connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("Database connection failed:", error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const databaseService = new DatabaseService();
