import { databaseService, TweetData } from "./database.js";
import { botConfig } from "../config/bot.js";

export interface MonitoringState {
  isRunning: boolean;
  lastCheck: Date | null;
  lastTweetsSent: Date | null;
  lastError?: string | null;
  stats: {
    totalChecks: number;
    totalTweetsSent: number;
    lastError: string | null;
  };
}

export class TwitterMonitorService {
  private state: MonitoringState = {
    isRunning: false,
    lastCheck: null,
    lastTweetsSent: null,
    lastError: null,
    stats: {
      totalChecks: 0,
      totalTweetsSent: 0,
      lastError: null,
    },
  };

  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start monitoring for new tweets
   */
  start(): boolean {
    if (this.state.isRunning) {
      console.log("🤖 Twitter monitoring is already running");
      return true;
    }

    try {
      const intervalMs = botConfig.monitoring.intervalMinutes * 60 * 1000;

      // Set up periodic checking
      this.intervalId = setInterval(async () => {
        await this.checkForNewTweets();
      }, intervalMs);

      this.state.isRunning = true;
      this.state.stats.lastError = null;

      console.log(
        `🚀 Twitter monitoring started (interval: ${botConfig.monitoring.intervalMinutes} minutes)`
      );

      // Run initial check after 30 seconds
      setTimeout(() => this.checkForNewTweets(), 30000);

      return true;
    } catch (error) {
      console.error("❌ Failed to start Twitter monitoring:", error);
      this.state.lastError = String(error);
      return false;
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state.isRunning = false;
    console.log("🛑 Twitter monitoring stopped");
  }

  /**
   * Get current monitoring status
   */
  getStatus(): MonitoringState {
    return { ...this.state };
  }

  /**
   * Reset monitoring state (useful for fixing time sync issues)
   */
  resetState(): void {
    this.state.lastTweetsSent = null;
    this.state.lastCheck = null;
    this.state.lastError = null;
    console.log("🔄 Monitoring state reset");
  }

  /**
   * Manual check for new tweets
   */
  async checkForNewTweets(
    skipTimeFilter: boolean = false
  ): Promise<TweetData[]> {
    console.log("🔍 Checking for new tweets...");

    try {
      this.state.stats.totalChecks++;
      this.state.lastCheck = new Date();

      // For manual fetch, skip time filtering to get all unsent tweets
      // For automatic monitoring, use time filtering
      const sinceDate = skipTimeFilter
        ? undefined
        : this.state.lastTweetsSent || undefined;

      const newTweets = await databaseService.getNewTweets(sinceDate);

      const sinceDateStr = sinceDate
        ? sinceDate.toISOString()
        : "beginning of time";
      console.log(
        `📊 Found ${newTweets.length} unsent tweets since ${sinceDateStr}`
      );

      if (newTweets.length > 0) {
        // Filter only processed tweets (that have AI analysis)
        const processedTweets = newTweets.filter(
          (tweet) => tweet.isProcessed && tweet.isRelevant
        );

        const unprocessedCount = newTweets.length - processedTweets.length;
        console.log(
          `✅ ${processedTweets.length} tweets are processed and relevant`
        );

        if (unprocessedCount > 0) {
          console.log(
            `⏳ ${unprocessedCount} tweets need AI analysis first (use /analyze <url>)`
          );
        }

        if (processedTweets.length > 0) {
          this.state.lastTweetsSent = new Date();
          this.state.stats.totalTweetsSent += processedTweets.length;
        }

        return processedTweets;
      }

      return [];
    } catch (error) {
      console.error("❌ Error checking for new tweets:", error);
      this.state.lastError = String(error);
      return [];
    }
  }

  /**
   * Manually trigger auto-monitoring from main app
   * This calls the main app's auto-monitor API to fetch new tweets
   */
  async triggerAutoMonitoring(): Promise<{
    success: boolean;
    message: string;
    processed?: number;
    added?: number;
  }> {
    try {
      console.log("🔄 Triggering auto-monitoring from main app...");

      // Make request to main app's auto-monitor API
      const response = await fetch("http://localhost:3000/api/auto-monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_token: botConfig.twitter.authToken,
          ct0: botConfig.twitter.csrfToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        processed?: number;
        added?: number;
      };
      console.log("✅ Auto-monitoring result:", result);

      return {
        success: result.success,
        message: result.message || "Auto-monitoring completed",
        processed: result.processed,
        added: result.added,
      };
    } catch (error) {
      console.error("❌ Error triggering auto-monitoring:", error);
      return {
        success: false,
        message: `Auto-monitoring failed: ${error}`,
      };
    }
  }

  /**
   * Combined monitoring: trigger auto-monitor then check for new tweets
   */
  async runFullMonitoringCycle(): Promise<TweetData[]> {
    console.log("🔄 Running full monitoring cycle...");

    // First, trigger auto-monitoring to fetch new tweets from Twitter
    const autoMonitorResult = await this.triggerAutoMonitoring();

    if (
      autoMonitorResult.success &&
      autoMonitorResult.added &&
      autoMonitorResult.added > 0
    ) {
      console.log(
        `✅ Auto-monitoring added ${autoMonitorResult.added} new tweets`
      );

      // Wait a bit for AI analysis to complete if auto-analysis is enabled
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Then check our database for new processed tweets (skip time filter for manual fetch)
    return await this.checkForNewTweets(true);
  }
}

export const twitterMonitorService = new TwitterMonitorService();
