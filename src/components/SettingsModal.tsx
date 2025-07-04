"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Save, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { setSessionAuth } = useAppStore();
  const [settings, setSettings] = useState({
    authToken: "",
    csrfToken: "",
    targetLanguage: "en",
    maxTweetsPerFetch: 50,
  });
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [showCsrfToken, setShowCsrfToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      // Load from localStorage for now (can be moved to API later)
      const saved = localStorage.getItem("twitterSettings");
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Save to localStorage for now (can be moved to API later)
      localStorage.setItem("twitterSettings", JSON.stringify(settings));

      // Sync with store for auto-monitoring
      if (settings.authToken && settings.csrfToken) {
        setSessionAuth({
          auth_token: settings.authToken,
          ct0: settings.csrfToken,
        });
      } else {
        setSessionAuth(null);
      }

      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSaveStatus("idle");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Twitter Session Settings */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Twitter Session
                </h3>
                <p className="text-sm text-gray-600">
                  Configure your Twitter authentication
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800 mb-3">
                🔐 These credentials are used for session-based parsing to
                access tweets and comments
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Token *
                </label>
                <div className="relative">
                  <input
                    type={showAuthToken ? "text" : "password"}
                    placeholder="auth_token from browser cookies"
                    value={settings.authToken}
                    onChange={(e) =>
                      setSettings({ ...settings, authToken: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthToken(!showAuthToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAuthToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CSRF Token *
                </label>
                <div className="relative">
                  <input
                    type={showCsrfToken ? "text" : "password"}
                    placeholder="ct0 from browser cookies"
                    value={settings.csrfToken}
                    onChange={(e) =>
                      setSettings({ ...settings, csrfToken: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCsrfToken(!showCsrfToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCsrfToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs text-blue-600 space-y-1">
                <p>💡 How to get these values:</p>
                <ol className="list-decimal list-inside pl-4 space-y-1">
                  <li>Open Twitter in your browser and log in</li>
                  <li>Open Developer Tools (F12)</li>
                  <li>Go to Application → Cookies → https://x.com</li>
                  <li>
                    Copy values for &apos;auth_token&apos; and &apos;ct0&apos;
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
                <span className="text-white text-sm font-bold">⚙</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  General Settings
                </h3>
                <p className="text-sm text-gray-600">Configure app behavior</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Analysis Language
                </label>
                <select
                  value={settings.targetLanguage}
                  onChange={(e) =>
                    setSettings({ ...settings, targetLanguage: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English 🇺🇸</option>
                  <option value="ru">Russian 🇷🇺</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tweets per Fetch
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={settings.maxTweetsPerFetch}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxTweetsPerFetch: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {saveStatus === "success" && (
              <span className="text-sm text-green-600">
                ✓ Settings saved successfully
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-sm text-red-600">
                ✗ Failed to save settings
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
