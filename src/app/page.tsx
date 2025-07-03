"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Settings, Plus, Loader2 } from "lucide-react";
import TweetCard from "@/components/TweetCard";
import ParserControls from "@/components/ParserControls";
import { useAppStore } from "@/stores/useAppStore";
import SettingsModal from "@/components/SettingsModal";

export default function HomePage() {
  const {
    tweets,
    setTweets,
    isLoading,
    setIsLoading,
    currentFilter,
    setCurrentFilter,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTweet, setShowAddTweet] = useState(false);
  const [newTweetUrl, setNewTweetUrl] = useState("");
  const [includeReplies, setIncludeReplies] = useState(false);

  const [sessionData, setSessionData] = useState({
    authToken: "",
    csrfToken: "",
  });
  const [analyzingTweets, setAnalyzingTweets] = useState<Set<string>>(
    new Set()
  );
  const [showSettings, setShowSettings] = useState(false);

  // Load session data from settings
  useEffect(() => {
    const loadSessionData = () => {
      try {
        const saved = localStorage.getItem("twitterSettings");
        if (saved) {
          const settings = JSON.parse(saved);
          setSessionData((prev) => ({
            ...prev,
            authToken: settings.authToken || "",
            csrfToken: settings.csrfToken || "",
          }));
        }
      } catch (error) {
        console.error("Failed to load session data:", error);
      }
    };

    loadSessionData();
  }, [showSettings]); // Reload when settings modal closes

  useEffect(() => {
    fetchTweets();
  }, [currentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTweets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tweets?filter=${currentFilter}`);
      const data = await response.json();
      setTweets(data.tweets || []);
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeTweet = async (tweetId: string, targetLang = "en") => {
    try {
      const tweet = tweets.find((t) => t.tweetId === tweetId);
      if (!tweet) return;

      // Add to analyzing set
      setAnalyzingTweets((prev) => new Set(prev).add(tweetId));

      // Use saved replies data if available, otherwise empty array
      let replies = [];
      if (tweet.repliesData) {
        try {
          replies = JSON.parse(tweet.repliesData);
        } catch (error) {
          console.error("Error parsing saved replies data:", error);
          replies = [];
        }
      }

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetId: tweet.tweetId,
          content: tweet.content,
          replies: replies, // Use saved replies data
          targetLang: targetLang,
        }),
      });

      if (response.ok) {
        await response.json();
        fetchTweets();
      } else {
        console.error("AI analysis failed:", response.status);
      }
    } catch (error) {
      console.error("Error analyzing tweet:", error);
    } finally {
      // Remove from analyzing set
      setAnalyzingTweets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tweetId);
        return newSet;
      });
    }
  };

  const handleAddTweet = async () => {
    if (!newTweetUrl) {
      alert("Enter tweet URL");
      return;
    }

    if (!sessionData.authToken || !sessionData.csrfToken) {
      alert("Enter Twitter session data (auth_token and ct0)");
      return;
    }

    try {
      // Use session method only
      const requestBody = {
        url: newTweetUrl,
        authToken: sessionData.authToken,
        csrfToken: sessionData.csrfToken,
        includeReplies: includeReplies,
      };

      // Parse the tweet with optional replies
      const parseResponse = await fetch("/api/parser/twitter-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        console.error("Parsing error:", errorData);
        alert(errorData.error || "Error parsing tweet");
        return;
      }

      const parseData = await parseResponse.json();

      if (!parseData.success) {
        alert("Failed to get data");
        return;
      }

      if (!parseData.tweet) {
        alert("Tweet not found for saving");
        return;
      }

      // Save tweet with replies data if available
      const tweetWithReplies = {
        ...parseData.tweet,
        repliesData: parseData.replies || null, // Include replies from parse result
      };

      const saveResponse = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tweetWithReplies),
      });

      if (saveResponse.ok) {
        setNewTweetUrl("");
        setIncludeReplies(false);
        setShowAddTweet(false);
        fetchTweets();

        const repliesMessage =
          parseData.replies?.length > 0
            ? ` with ${parseData.replies.length} comments`
            : "";
        alert(`Tweet successfully added${repliesMessage}`);

        // If replies were fetched, automatically analyze
        if (
          includeReplies &&
          parseData.replies &&
          parseData.replies.length > 0
        ) {
          setTimeout(() => {
            handleAnalyzeTweet(parseData.tweet.tweetId);
          }, 1000);
        }
      } else {
        const errorData = await saveResponse.json();
        alert(errorData.error || "Error saving tweet");
      }
    } catch (error) {
      console.error("Error adding tweet:", error);
      alert("Error occurred while adding tweet");
    }
  };

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove tweet from store state
        setTweets(tweets.filter((tweet) => tweet.id !== tweetId));
        alert("✅ Tweet successfully deleted");
      } else {
        const errorData = await response.json();
        alert(`❌ Delete error: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
      alert("❌ Error occurred while deleting tweet");
    }
  };

  const filteredTweets = (tweets || []).filter(
    (tweet) =>
      searchQuery === "" ||
      tweet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tweet.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tweet.authorUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filters = [
    { key: "all", label: "All Tweets" },
    { key: "relevant", label: "Relevant" },
    { key: "favorites", label: "Favorites" },
    { key: "ethereum", label: "Ethereum" },
    { key: "defi", label: "DeFi" },
    { key: "nft", label: "NFT" },
    { key: "blockchain", label: "Blockchain" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">X Parser</h1>
              <p className="text-sm text-gray-600">
                AI-powered Twitter analysis with thread support
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddTweet(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tweet</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Parser Controls */}
        <ParserControls onTweetsUpdated={fetchTweets} />

        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tweets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setCurrentFilter(filter.key)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    currentFilter === filter.key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add Tweet Modal */}
        {showAddTweet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddTweet(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add Tweet</h3>

              {/* Session method info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-700 mb-2">
                  🔐 Session-based parsing
                </div>
                <div className="text-sm text-gray-600">
                  Uses Twitter authorization via browser cookies for full access
                  to tweets and comments
                </div>
              </div>

              {/* URL Input */}
              <input
                type="url"
                placeholder="https://x.com/username/status/123456789"
                value={newTweetUrl}
                onChange={(e) => setNewTweetUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />

              {/* Session status */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  🔐 Session Status
                </div>
                {sessionData.authToken && sessionData.csrfToken ? (
                  <div className="text-sm text-green-600">
                    ✓ Session configured
                  </div>
                ) : (
                  <div className="text-sm text-orange-600">
                    ⚠ Configure session in{" "}
                    <button
                      onClick={() => setShowSettings(true)}
                      className="underline hover:text-orange-700"
                    >
                      Settings
                    </button>
                  </div>
                )}
              </div>

              {/* Thread Analysis Option */}
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeReplies}
                    onChange={(e) => setIncludeReplies(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Include comments analysis (thread)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Analysis of reactions and sentiments in comments
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddTweet}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddTweet(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading tweets...</span>
          </div>
        ) : filteredTweets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tweets found</p>
            <button
              onClick={() => setShowAddTweet(true)}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              Add first tweet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTweets.map((tweet) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                onAnalyze={handleAnalyzeTweet}
                onDelete={handleDeleteTweet}
                isAnalyzing={analyzingTweets.has(tweet.tweetId)}
              />
            ))}
          </div>
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  );
}
