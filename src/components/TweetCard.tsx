"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  TrendingUp,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
  Globe,
} from "lucide-react";
import { Tweet, AISummaryResult, ThreadStructure } from "@/types";
import ThreadDisplay from "./ThreadDisplay";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAppStore } from "@/stores/useAppStore";
import clsx from "clsx";

interface TweetCardProps {
  tweet: Tweet;
  onAnalyze?: (tweetId: string, targetLang?: string) => void;
  onDelete?: (tweetId: string) => void;
  isAnalyzing?: boolean;
  threadStructure?: ThreadStructure | null;
}

export default function TweetCard({
  tweet,
  onAnalyze,
  onDelete,
  isAnalyzing = false,
  threadStructure,
}: TweetCardProps) {
  const { expandedTweets, toggleTweetExpansion, toggleFavorite } =
    useAppStore();
  const isExpanded = expandedTweets.has(tweet.id);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const languages = [
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const handleExpand = () => {
    toggleTweetExpansion(tweet.id);
  };

  const handleFavorite = () => {
    toggleFavorite(tweet.id);
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Force reanalysis with new language - pass language directly
    if (onAnalyze) {
      onAnalyze(tweet.tweetId, languageCode);
      setShowLanguageSelector(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete this tweet?\n\nAuthor: @${
          tweet.authorUsername
        }\nContent: ${tweet.content.substring(0, 100)}${
          tweet.content.length > 100 ? "..." : ""
        }`
      );

      if (confirmDelete) {
        onDelete(tweet.id);
      }
    }
  };

  const categories = tweet.categories ? JSON.parse(tweet.categories) : [];
  const aiComments = tweet.aiComments
    ? (JSON.parse(tweet.aiComments) as AISummaryResult)
    : null;

  // Extract thread structure from repliesData if available
  const threadStructureFromData = tweet.repliesData
    ? (() => {
        try {
          const parsed = JSON.parse(tweet.repliesData);
          // Support both direct threadStructure and wrapped in object
          if (parsed.threadStructure) {
            return parsed.threadStructure;
          }
          // Check if it's a direct ThreadStructure object
          if (parsed.totalReplies !== undefined) {
            return parsed;
          }
          return null;
        } catch {
          return null;
        }
      })()
    : null;
  const actualThreadStructure = threadStructure || threadStructureFromData;

  const getRelevanceColor = (score?: number) => {
    if (!score) return "bg-gray-100";
    if (score >= 0.8) return "bg-green-100 text-green-800";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  const getImpactColor = (level?: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500";
      case "negative":
        return "bg-red-500";
      case "neutral":
        return "bg-gray-500";
      case "mixed":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "Positive";
      case "negative":
        return "Negative";
      case "neutral":
        return "Neutral";
      case "mixed":
        return "Mixed";
      default:
        return sentiment;
    }
  };

  // Check if this is a thread analysis
  const hasThreadAnalysis = aiComments?.thread_analysis;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {tweet.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{tweet.authorName}</h3>
            <p className="text-sm text-gray-500">@{tweet.authorUsername}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasThreadAnalysis && (
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              Thread Analysis
            </span>
          )}

          {tweet.isRelevant && tweet.relevanceScore && (
            <span
              className={clsx(
                "px-2 py-1 text-xs font-medium rounded-full",
                getRelevanceColor(tweet.relevanceScore)
              )}
            >
              {Math.round(tweet.relevanceScore * 100)}% relevance
            </span>
          )}

          <button
            onClick={handleFavorite}
            className={clsx(
              "p-2 rounded-full transition-colors",
              tweet.isFavorite
                ? "text-yellow-500 hover:text-yellow-600"
                : "text-gray-400 hover:text-yellow-500"
            )}
          >
            <Star
              className="w-4 h-4"
              fill={tweet.isFavorite ? "currentColor" : "none"}
            />
          </button>

          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete tweet"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((category: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {tweet.content}
        </p>
      </div>

      {/* Translation */}
      {tweet.translation && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-sm font-medium text-blue-800 mb-1">Translation:</p>
          <p className="text-gray-700 whitespace-pre-wrap">
            {tweet.translation}
          </p>
        </div>
      )}

      {/* Thread Structure Display */}
      {actualThreadStructure && actualThreadStructure.totalReplies > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">
            Debug: Found {actualThreadStructure.totalReplies} replies, depth:{" "}
            {actualThreadStructure.maxDepth}
          </div>
          <ThreadDisplay threadStructure={actualThreadStructure} />
        </div>
      )}

      {/* Debug: Show if we have thread data but no replies */}
      {actualThreadStructure && actualThreadStructure.totalReplies === 0 && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-xs text-yellow-700">
            Debug: Thread structure found but no replies (totalReplies:{" "}
            {actualThreadStructure.totalReplies})
          </div>
        </div>
      )}

      {/* Debug: Show if we have repliesData but no thread structure */}
      {!actualThreadStructure && tweet.repliesData && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
          <div className="text-xs text-red-700">
            Debug: repliesData exists but no valid thread structure found
            <br />
            Data preview: {tweet.repliesData.substring(0, 100)}...
          </div>
        </div>
      )}

      {/* Thread Analysis Quick Stats */}
      {hasThreadAnalysis && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-purple-700">
                <MessageCircle className="w-4 h-4" />
                <span>
                  {aiComments.thread_analysis?.total_replies || 0} comments
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-purple-700">
                <Users className="w-4 h-4" />
                <span>Community Pulse</span>
              </div>
            </div>
            <div className="text-xs text-purple-600 font-medium">
              {aiComments.thread_analysis?.community_pulse || "N/A"}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Toggle */}
      {(tweet.summary || tweet.aiComments) && (
        <div className="mb-4">
          <button
            onClick={handleExpand}
            className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors"
          >
            <span className="text-sm font-medium text-purple-800">
              {hasThreadAnalysis ? "Full Thread Analysis" : "AI Analysis"}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-purple-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-600" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-white border border-purple-200 rounded-lg"
              >
                {tweet.summary && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Summary:
                    </h4>
                    <p className="text-sm text-gray-700">{tweet.summary}</p>
                  </div>
                )}

                {aiComments && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Expert Commentary:
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      {aiComments.expert_commentary ||
                        aiComments.expert_comment}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500">
                        Impact Level:
                      </span>
                      <span
                        className={clsx(
                          "px-2 py-1 text-xs font-medium rounded border",
                          getImpactColor(aiComments.impact_level)
                        )}
                      >
                        {aiComments.impact_level === "high"
                          ? "High"
                          : aiComments.impact_level === "medium"
                          ? "Medium"
                          : "Low"}
                      </span>
                    </div>

                    {/* Project Impact Analysis */}
                    {aiComments.project_impact && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                        <h5 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                          <div className="w-5 h-5 bg-blue-600 rounded mr-2 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              P
                            </span>
                          </div>
                          Project Impact Analysis
                          {hasThreadAnalysis && (
                            <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                              Thread Analysis
                            </span>
                          )}
                        </h5>

                        <div className="space-y-3">
                          <div>
                            <h6 className="text-xs font-medium text-blue-800 mb-1">
                              Relevance to Project:
                            </h6>
                            <p className="text-xs text-gray-700">
                              {aiComments.project_impact.relevance_to_project}
                            </p>
                          </div>

                          <div>
                            <h6 className="text-xs font-medium text-blue-800 mb-1">
                              Main Tweet Impact:
                            </h6>
                            <p className="text-xs text-gray-700">
                              {aiComments.project_impact.main_tweet_impact}
                            </p>
                          </div>

                          {hasThreadAnalysis &&
                            aiComments.project_impact.comments_impact &&
                            aiComments.project_impact.comments_impact !==
                              "not applicable for single tweet" &&
                            aiComments.project_impact.comments_impact !==
                              "not applicable for single tweet" && (
                              <div>
                                <h6 className="text-xs font-medium text-purple-800 mb-1">
                                  Comments Impact:
                                </h6>
                                <p className="text-xs text-gray-700">
                                  {aiComments.project_impact.comments_impact}
                                </p>
                              </div>
                            )}

                          <div>
                            <h6 className="text-xs font-medium text-blue-800 mb-1">
                              Overall Impact:
                            </h6>
                            <p className="text-xs text-gray-700">
                              {aiComments.project_impact.overall_impact}
                            </p>
                          </div>

                          {aiComments.project_impact.opportunities && (
                            <div>
                              <h6 className="text-xs font-medium text-green-800 mb-1">
                                Opportunities:
                              </h6>
                              <p className="text-xs text-gray-700">
                                {aiComments.project_impact.opportunities}
                              </p>
                            </div>
                          )}

                          {aiComments.project_impact.threats && (
                            <div>
                              <h6 className="text-xs font-medium text-red-800 mb-1">
                                Threats:
                              </h6>
                              <p className="text-xs text-gray-700">
                                {aiComments.project_impact.threats}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Thread Analysis Details */}
                    {hasThreadAnalysis && (
                      <div className="space-y-4">
                        <div className="border-t pt-4">
                          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Comments Analysis
                          </h5>

                          {/* Sentiment Breakdown */}
                          <div className="mb-4">
                            <h6 className="text-xs font-medium text-gray-700 mb-2">
                              Comments Sentiment:
                            </h6>
                            <div className="space-y-2">
                              {Object.entries(
                                aiComments.thread_analysis
                                  ?.sentiment_breakdown || {}
                              ).map(([sentiment, count]) => (
                                <div
                                  key={sentiment}
                                  className="flex items-center space-x-2"
                                >
                                  <div
                                    className={clsx(
                                      "w-3 h-3 rounded-full",
                                      getSentimentColor(sentiment)
                                    )}
                                  />
                                  <span className="text-xs text-gray-600">
                                    {getSentimentLabel(sentiment)}: {count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Key Reactions */}
                          {aiComments.thread_analysis?.key_reactions &&
                            aiComments.thread_analysis.key_reactions.length >
                              0 && (
                              <div className="mb-4">
                                <h6 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Key Reactions:
                                </h6>
                                <ul className="space-y-1">
                                  {aiComments.thread_analysis.key_reactions.map(
                                    (reaction, index) => (
                                      <li
                                        key={index}
                                        className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200"
                                      >
                                        {reaction}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Trending Topics */}
                          {aiComments.thread_analysis?.trending_topics &&
                            aiComments.thread_analysis.trending_topics.length >
                              0 && (
                              <div className="mb-4">
                                <h6 className="text-xs font-medium text-gray-700 mb-2">
                                  Trending Topics:
                                </h6>
                                <div className="flex flex-wrap gap-1">
                                  {aiComments.thread_analysis.trending_topics.map(
                                    (topic, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
                                      >
                                        {topic}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Controversial Points */}
                          {aiComments.thread_analysis?.controversial_points &&
                            aiComments.thread_analysis.controversial_points
                              .length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-xs font-medium text-red-700 mb-2 flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Controversial Points:
                                </h6>
                                <ul className="space-y-1">
                                  {aiComments.thread_analysis.controversial_points.map(
                                    (point, index) => (
                                      <li
                                        key={index}
                                        className="text-xs text-red-600 pl-2 border-l-2 border-red-200"
                                      >
                                        {point}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{tweet.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Repeat2 className="w-4 h-4" />
            <span>{tweet.retweets}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{tweet.replies}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span>
            {formatDistanceToNow(new Date(tweet.createdAt), {
              locale: ru,
              addSuffix: true,
            })}
          </span>

          {/* Analysis Controls */}
          <div className="relative">
            {isAnalyzing ? (
              <div className="flex items-center space-x-2 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </div>
            ) : (
              <>
                {!tweet.isProcessed ? (
                  <button
                    onClick={() =>
                      setShowLanguageSelector(!showLanguageSelector)
                    }
                    className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-full transition-colors flex items-center space-x-1"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Analyze</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setShowLanguageSelector(!showLanguageSelector)
                    }
                    className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 rounded-full transition-colors flex items-center space-x-1"
                    title="Re-analyze with different language"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-analyze</span>
                  </button>
                )}

                {/* Language Selector Dropdown */}
                {showLanguageSelector && (
                  <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Select analysis language:
                      </div>
                      <div className="space-y-1">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={clsx(
                              "w-full flex items-center space-x-2 px-3 py-2 text-xs rounded-md transition-colors text-left",
                              selectedLanguage === lang.code
                                ? "bg-purple-100 text-purple-800"
                                : "hover:bg-gray-100 text-gray-700"
                            )}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                            {selectedLanguage === lang.code && (
                              <span className="ml-auto text-purple-600">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
