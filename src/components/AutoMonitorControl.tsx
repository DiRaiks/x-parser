"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  startAutoMonitoring,
  stopAutoMonitoring,
  getMonitoringStatus,
  setMonitoringCredentials,
  runManualMonitoring,
} from "@/lib/auto-monitor";

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

export default function AutoMonitorControl() {
  const { sessionAuth } = useAppStore();
  const [monitoringStatus, setMonitoringStatus] =
    useState<MonitoringState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch current monitoring status
  const fetchStatus = () => {
    try {
      const status = getMonitoringStatus();
      setMonitoringStatus(status);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch monitoring status:", error);
    }
  };

  // Control monitoring
  const controlMonitoring = async (action: string) => {
    if (!sessionAuth?.auth_token || !sessionAuth?.ct0) {
      alert("Please configure Twitter session first");
      return;
    }

    setIsLoading(true);
    try {
      let result = false;
      let message = "";

      // Set credentials first
      setMonitoringCredentials(sessionAuth.auth_token, sessionAuth.ct0);

      switch (action) {
        case "start":
          result = startAutoMonitoring();
          message = result
            ? "Auto-monitoring started successfully"
            : "Failed to start auto-monitoring";
          break;

        case "stop":
          stopAutoMonitoring();
          result = true;
          message = "Auto-monitoring stopped";
          break;

        case "manual_run":
          const manualResult = await runManualMonitoring();
          result = manualResult.success;
          message = manualResult.message;

          // Refresh tweets list after manual run if successful
          if (
            result &&
            manualResult.data?.stats.totalAdded &&
            manualResult.data.stats.totalAdded > 0
          ) {
            // Trigger page refresh
            window.location.reload();
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update status after action
      fetchStatus();

      if (!result) {
        alert(message || "Operation failed");
      }
    } catch (error) {
      console.error("Error controlling monitoring:", error);
      alert("Failed to control monitoring");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch status on component mount and periodically
  useEffect(() => {
    fetchStatus();

    // Update status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sync session credentials with auto-monitoring service
  useEffect(() => {
    if (sessionAuth?.auth_token && sessionAuth?.ct0) {
      setMonitoringCredentials(sessionAuth.auth_token, sessionAuth.ct0);
    }
  }, [sessionAuth]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    if (status === "running") return "text-green-600";
    if (status.startsWith("error")) return "text-red-600";
    if (status.startsWith("success")) return "text-blue-600";
    return "text-gray-600";
  };

  const getStatusIcon = (isRunning: boolean) => {
    return isRunning ? "🟢" : "🔴";
  };

  if (!monitoringStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Auto-monitoring</h3>
        <div className="text-gray-500">Loading status...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Twitter Timeline Monitor</h3>
          <p className="text-sm text-gray-600">
            Automatic tweet collection and analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStatus}
            className="text-blue-600 hover:text-blue-800 text-sm"
            disabled={isLoading}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl mb-1">
            {getStatusIcon(monitoringStatus.isRunning)}
          </div>
          <div className="text-sm text-gray-600">
            {monitoringStatus.isRunning ? "Running" : "Stopped"}
          </div>
        </div>

        <div className="text-center">
          <div className="text-xl font-semibold text-blue-600">
            {monitoringStatus.stats.totalRuns}
          </div>
          <div className="text-sm text-gray-600">Total Runs</div>
        </div>

        <div className="text-center">
          <div className="text-xl font-semibold text-green-600">
            {monitoringStatus.stats.totalAdded}
          </div>
          <div className="text-sm text-gray-600">Tweets Added</div>
        </div>

        <div className="text-center">
          <div className="text-xl font-semibold text-purple-600">
            {monitoringStatus.stats.totalProcessed}
          </div>
          <div className="text-sm text-gray-600">Total Processed</div>
        </div>
      </div>

      {/* Status details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <span className={getStatusColor(monitoringStatus.lastStatus)}>
            {monitoringStatus.lastStatus}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last Run:</span>
          <span>{formatDate(monitoringStatus.lastRun)}</span>
        </div>

        {monitoringStatus.stats.lastError && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last Error:</span>
            <span className="text-red-600 text-right max-w-xs truncate">
              {monitoringStatus.stats.lastError}
            </span>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex flex-wrap gap-2">
        {!monitoringStatus.isRunning ? (
          <button
            onClick={() => controlMonitoring("start")}
            disabled={isLoading || !sessionAuth?.auth_token}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Starting..." : "Start Monitoring"}
          </button>
        ) : (
          <button
            onClick={() => controlMonitoring("stop")}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Stopping..." : "Stop Monitoring"}
          </button>
        )}

        <button
          onClick={() => controlMonitoring("manual_run")}
          disabled={isLoading || !sessionAuth?.auth_token}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Running..." : "Run Now"}
        </button>

        {!sessionAuth?.auth_token && (
          <div className="text-sm text-orange-600 flex items-center space-x-2">
            <span>⚠️ Configure Twitter session to enable monitoring</span>
            <button
              onClick={() => {
                // Try to trigger settings modal (assuming it's available globally)
                const settingsButton = document.querySelector(
                  "[data-settings-button]"
                ) as HTMLButtonElement;
                if (settingsButton) {
                  settingsButton.click();
                } else {
                  alert(
                    "Go to Settings (⚙️ button in top right) to configure Twitter session credentials"
                  );
                }
              }}
              className="underline hover:text-orange-700 font-medium"
            >
              Open Settings
            </button>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-500 space-y-2">
        <div>
          <strong>🚀 Automatic Twitter Timeline Monitoring</strong>
          <br />
          Continuously monitors your Twitter timeline every 30 minutes and
          automatically adds relevant tweets to the database. Uses AI to filter
          tweets based on relevance score and skips duplicates.
        </div>
        {!sessionAuth?.auth_token && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
            <div className="font-medium mb-1">📋 Setup Instructions:</div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click Settings (⚙️) in the top right corner</li>
              <li>
                In &quot;Twitter Session&quot; section, add your auth_token and
                ct0
              </li>
              <li>Save settings and return here</li>
              <li>
                Click &quot;Start Monitoring&quot; to begin automatic monitoring
              </li>
              <li>Use &quot;Run Now&quot; for immediate one-time check</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
