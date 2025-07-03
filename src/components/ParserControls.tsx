"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Square,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ParserControlsProps {
  onTweetsUpdated: () => void;
}

export default function ParserControls({
  onTweetsUpdated,
}: ParserControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [sessionConfigured, setSessionConfigured] = useState(false);
  const [includeReplies, setIncludeReplies] = useState(false);

  // Check session configuration on component mount
  useEffect(() => {
    checkSessionConfiguration();
  }, []);

  const checkSessionConfiguration = () => {
    try {
      const saved = localStorage.getItem("twitterSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        const hasSession = settings.authToken && settings.csrfToken;
        setSessionConfigured(hasSession);
      } else {
        setSessionConfigured(false);
      }
    } catch (error) {
      console.error("Failed to check session configuration:", error);
      setSessionConfigured(false);
    }
  };

  const getSessionCredentials = () => {
    try {
      const saved = localStorage.getItem("twitterSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          authToken: settings.authToken || "",
          csrfToken: settings.csrfToken || "",
        };
      }
    } catch (error) {
      console.error("Failed to get session credentials:", error);
    }
    return { authToken: "", csrfToken: "" };
  };

  const handleStart = async () => {
    if (!sessionConfigured) {
      setStatus("error");
      setMessage("Configure session data in settings");
      return;
    }

    setIsRunning(true);
    setStatus("loading");
    setMessage("Fetching tweets from timeline feed...");

    try {
      const credentials = getSessionCredentials();

      const response = await fetch("/api/parser/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: credentials.authToken,
          csrfToken: credentials.csrfToken,
          count: 50, // Get more tweets from timeline
          includeReplies: includeReplies,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save all tweets to database
        let savedCount = 0;
        for (const tweet of data.tweets) {
          try {
            const saveResponse = await fetch("/api/tweets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(tweet),
            });
            if (saveResponse.ok) savedCount++;
          } catch (saveError) {
            console.error("Error saving tweet:", saveError);
          }
        }

        setStatus("success");
        setMessage(
          `Fetched ${data.count} tweets from timeline, saved ${savedCount}`
        );
        onTweetsUpdated();
      } else {
        setStatus("error");
        setMessage(data.error || "Error fetching timeline");
        setIsRunning(false);
      }
    } catch (error) {
      console.error("Start parser error:", error);
      setStatus("error");
      setMessage("Connection error to server");
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    setIsRunning(false);
    setStatus("idle");
    setMessage("");
  };

  const handleFetch = async () => {
    if (!sessionConfigured) {
      setStatus("error");
      setMessage("Configure session data in settings");
      return;
    }

    setStatus("loading");
    setMessage("Fetching fresh tweets from timeline...");

    try {
      const credentials = getSessionCredentials();

      const response = await fetch("/api/parser/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: credentials.authToken,
          csrfToken: credentials.csrfToken,
          count: 20, // Smaller batch for quick fetch
          includeReplies: includeReplies,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save all tweets to database
        let savedCount = 0;
        for (const tweet of data.tweets) {
          try {
            const saveResponse = await fetch("/api/tweets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(tweet),
            });
            if (saveResponse.ok) savedCount++;
          } catch (saveError) {
            console.error("Error saving tweet:", saveError);
          }
        }

        setStatus("success");
        setMessage(`Fetched ${data.count} tweets, saved ${savedCount}`);
        onTweetsUpdated();
      } else {
        setStatus("error");
        setMessage(data.error || "Error fetching tweets");
      }
    } catch (error) {
      console.error("Fetch parser error:", error);
      setStatus("error");
      setMessage("Connection error to server");
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Twitter Parser
          </h2>
          <p className="text-sm text-gray-600">
            Session-based account monitoring
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              sessionConfigured ? "bg-green-400" : "bg-orange-400"
            } ${isRunning ? "animate-pulse" : ""}`}
          />
          <span className="text-sm text-gray-600">
            {sessionConfigured
              ? isRunning
                ? "Active"
                : "Ready"
              : "Not configured"}
          </span>
        </div>
      </div>

      {/* Session status */}
      {!sessionConfigured && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-800">
            🔐 Session not configured. Please configure Twitter session in
            Settings.
          </div>
        </div>
      )}

      {/* Timeline Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          📱 <strong>Home Timeline Monitoring</strong>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Automatically fetches latest tweets from accounts you follow
        </div>
      </div>

      {/* Include Replies Option */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeReplies}
            onChange={(e) => setIncludeReplies(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isRunning}
          />
          <span className="text-sm text-gray-700">
            Include comments analysis for each tweet
          </span>
        </label>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-3">
        {!isRunning ? (
          <>
            <button
              onClick={handleStart}
              disabled={!sessionConfigured}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
            <button
              onClick={handleFetch}
              disabled={!sessionConfigured}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Fetch</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        )}

        <button
          onClick={checkSessionConfiguration}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh session status"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Status */}
      {status !== "idle" && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm">{message}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
