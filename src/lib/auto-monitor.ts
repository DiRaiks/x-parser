// Default config for client-side
const DEFAULT_AUTO_MONITORING_CONFIG = {
  enabled: true,
  interval_minutes: 30,
  max_tweets_per_check: 50,
  check_home_timeline: true,
  auto_add_relevant_only: true,
  min_relevance_score: 0.5,
  skip_retweets: true,
  skip_replies: false,
};

interface MonitoringState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  lastRun: Date | null;
  lastStatus: string;
  stats: {
    totalRuns: number;
    totalProcessed: number;
    totalAdded: number;
    lastError: string | null;
  };
}

class AutoMonitorService {
  private state: MonitoringState = {
    isRunning: false,
    intervalId: null,
    lastRun: null,
    lastStatus: "stopped",
    stats: {
      totalRuns: 0,
      totalProcessed: 0,
      totalAdded: 0,
      lastError: null,
    },
  };

  private sessionCredentials: { auth_token: string; ct0: string } | null = null;

  constructor() {
    // Check if we're in browser environment
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      const config = DEFAULT_AUTO_MONITORING_CONFIG;
      if (config && config.enabled && this.sessionCredentials) {
        console.log("Auto-monitoring is enabled, starting service...");
        this.start();
      }
    } catch (error) {
      console.error("Error initializing auto-monitoring:", error);
    }
  }

  setSessionCredentials(auth_token: string, ct0: string) {
    this.sessionCredentials = { auth_token, ct0 };
    console.log("Twitter session credentials updated for auto-monitoring");

    // Start monitoring if enabled and not already running
    try {
      const config = DEFAULT_AUTO_MONITORING_CONFIG;
      if (config && config.enabled && !this.state.isRunning) {
        this.start();
      }
    } catch (error) {
      console.error("Error getting auto-monitoring config:", error);
    }
  }

  clearSessionCredentials() {
    this.sessionCredentials = null;
    console.log("Twitter session credentials cleared");
    this.stop();
  }

  start(): boolean {
    // Only run in browser environment
    if (typeof window === "undefined") {
      console.log("Auto-monitoring can only run in browser environment");
      return false;
    }

    try {
      const config = DEFAULT_AUTO_MONITORING_CONFIG;

      if (!config || !config.enabled) {
        console.log("Auto-monitoring is disabled in config");
        return false;
      }

      if (!this.sessionCredentials) {
        console.log("Cannot start auto-monitoring: no session credentials");
        this.state.lastStatus = "error: no credentials";
        return false;
      }

      if (this.state.isRunning) {
        console.log("Auto-monitoring is already running");
        return true;
      }

      const intervalMs = config.interval_minutes * 60 * 1000;

      this.state.intervalId = setInterval(async () => {
        await this.runMonitoring();
      }, intervalMs);

      this.state.isRunning = true;
      this.state.lastStatus = "running";

      console.log(
        `Auto-monitoring started with interval: ${config.interval_minutes} minutes`
      );

      // Run immediately on start
      setTimeout(() => this.runMonitoring(), 5000); // 5 second delay for startup

      return true;
    } catch (error) {
      console.error("Failed to start auto-monitoring:", error);
      this.state.lastStatus = `error: ${error}`;
      return false;
    }
  }

  stop(): void {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }

    this.state.isRunning = false;
    this.state.lastStatus = "stopped";

    console.log("Auto-monitoring stopped");
  }

  private async runMonitoring(): Promise<void> {
    if (!this.sessionCredentials) {
      console.error("No session credentials available for monitoring");
      this.state.lastStatus = "error: no credentials";
      return;
    }

    try {
      console.log("Running auto-monitoring check...");
      this.state.lastRun = new Date();
      this.state.stats.totalRuns++;

      // Construct absolute URL for API call
      const apiUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/api/auto-monitor`
          : "/api/auto-monitor";

      console.log("Making request to:", apiUrl);
      console.log("With credentials:", {
        auth_token: this.sessionCredentials.auth_token ? "***" : "missing",
        ct0: this.sessionCredentials.ct0 ? "***" : "missing",
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.sessionCredentials),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response error:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("API response:", result);

      if (result.success) {
        this.state.stats.totalProcessed += result.processed || 0;
        this.state.stats.totalAdded += result.added || 0;
        this.state.lastStatus = `success: added ${result.added} tweets`;
        this.state.stats.lastError = null;

        console.log(`Auto-monitoring completed: ${result.message}`);

        // Trigger page refresh if tweets were added
        if (result.added > 0 && typeof window !== "undefined") {
          // Dispatch custom event for UI updates
          window.dispatchEvent(
            new CustomEvent("tweetsUpdated", {
              detail: { added: result.added },
            })
          );
        }
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Auto-monitoring failed:", errorMessage);
      this.state.lastStatus = `error: ${errorMessage}`;
      this.state.stats.lastError = errorMessage;
    }
  }

  getStatus(): MonitoringState {
    return { ...this.state };
  }

  async manualRun(): Promise<{
    success: boolean;
    message: string;
    data?: MonitoringState;
  }> {
    if (!this.sessionCredentials) {
      return {
        success: false,
        message: "No session credentials available",
      };
    }

    try {
      console.log("Manual auto-monitoring triggered");
      await this.runMonitoring();

      return {
        success: true,
        message: "Manual monitoring completed",
        data: this.getStatus(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  updateConfig(): void {
    try {
      const config = DEFAULT_AUTO_MONITORING_CONFIG;

      if (
        config &&
        config.enabled &&
        !this.state.isRunning &&
        this.sessionCredentials
      ) {
        this.start();
      } else if (config && !config.enabled && this.state.isRunning) {
        this.stop();
      } else if (this.state.isRunning) {
        // Restart with new interval
        this.stop();
        if (config && config.enabled && this.sessionCredentials) {
          this.start();
        }
      }
    } catch (error) {
      console.error("Error updating auto-monitoring config:", error);
    }
  }
}

// Global instance
export const autoMonitorService = new AutoMonitorService();

// Helper functions for external use
export function startAutoMonitoring(): boolean {
  return autoMonitorService.start();
}

export function stopAutoMonitoring(): void {
  autoMonitorService.stop();
}

export function getMonitoringStatus(): MonitoringState {
  return autoMonitorService.getStatus();
}

export function setMonitoringCredentials(
  auth_token: string,
  ct0: string
): void {
  autoMonitorService.setSessionCredentials(auth_token, ct0);
}

export function clearMonitoringCredentials(): void {
  autoMonitorService.clearSessionCredentials();
}

export async function runManualMonitoring(): Promise<{
  success: boolean;
  message: string;
  data?: MonitoringState;
}> {
  return autoMonitorService.manualRun();
}
