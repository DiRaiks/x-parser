"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  ExternalLink,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  RefreshCw,
  Brain,
  Microscope,
} from "lucide-react";
import { Tweet, AIAnalysis } from "@/types";
import ThreadDisplay from "./ThreadDisplay";

interface TweetCardProps {
  tweet: Tweet;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAnalyze: (tweetId: string, targetLang: string) => void;
  isAnalyzing?: boolean;
}

export default function TweetCard({
  tweet,
  onDelete,
  onToggleFavorite,
  onAnalyze,
  isAnalyzing = false,
}: TweetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showSimpleView, setShowSimpleView] = useState(true);

  const languageSelectorRef = useRef<HTMLDivElement>(null);

  // Click outside to close language selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageSelectorRef.current &&
        !languageSelectorRef.current.contains(event.target as Node)
      ) {
        setShowLanguageSelector(false);
      }
    };

    if (showLanguageSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageSelector]);

  const handleLanguageSelect = (lang: string) => {
    setShowLanguageSelector(false);
    onAnalyze(tweet.tweetId, lang);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes}м назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}ч назад`;
    return `${Math.floor(diffInMinutes / 1440)}д назад`;
  };

  // Parse AI analysis
  const categories = tweet.categories ? JSON.parse(tweet.categories) : [];
  const aiAnalysis: AIAnalysis | null = tweet.aiComments
    ? JSON.parse(tweet.aiComments)
    : null;

  // Check if we have valid AI analysis
  const hasAiAnalysis = aiAnalysis && aiAnalysis.simple && aiAnalysis.expert;

  // Check if this is a thread
  const isThread = aiAnalysis?.type === "thread";

  // Check if analysis was done in Russian (simple heuristic: check if title contains Cyrillic)
  const isRussianAnalysis =
    aiAnalysis?.simple.title && /[а-яё]/i.test(aiAnalysis.simple.title);

  // Extract thread structure
  const threadStructure = tweet.repliesData
    ? JSON.parse(tweet.repliesData)
    : null;
  const hasThreadData =
    threadStructure &&
    threadStructure.replies &&
    threadStructure.replies.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {tweet.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {tweet.authorName}
              </h3>
              <p className="text-sm text-gray-500">@{tweet.authorUsername}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Analysis Button */}
            <div className="relative" ref={languageSelectorRef}>
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                disabled={isAnalyzing}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                  isAnalyzing
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:from-blue-100 hover:to-purple-100 hover:shadow-sm"
                }`}
              >
                <RefreshCw
                  size={14}
                  className={isAnalyzing ? "animate-spin" : ""}
                />
                <span>
                  {isAnalyzing
                    ? "Analyzing..."
                    : hasAiAnalysis
                    ? "Re-analyze"
                    : "Analyze"}
                </span>
              </button>

              {/* Language Selector Dropdown */}
              <AnimatePresence>
                {showLanguageSelector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32"
                  >
                    <button
                      onClick={() => handleLanguageSelect("en")}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg"
                    >
                      🇺🇸 English
                    </button>
                    <button
                      onClick={() => handleLanguageSelect("ru")}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 last:rounded-b-lg"
                    >
                      🇷🇺 Русский
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => onToggleFavorite(tweet.id)}
              className={`p-2 rounded-full transition-colors ${
                tweet.isFavorite
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-400 hover:text-yellow-500"
              }`}
            >
              {tweet.isFavorite ? <Star size={16} /> : <StarOff size={16} />}
            </button>
            <button
              onClick={() => onDelete(tweet.id)}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tweet Content */}
        <p className="text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed">
          {tweet.content}
        </p>

        {/* Translation (for Russian analysis) */}
        {tweet.translation &&
          tweet.translation.trim() !== "" &&
          tweet.translation !== tweet.content &&
          isRussianAnalysis && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  🇷🇺 Перевод
                </span>
              </div>
              <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                {tweet.translation}
              </p>
            </div>
          )}

        {/* Tweet Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Heart size={14} />
              <span>{formatNumber(tweet.likes)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Repeat2 size={14} />
              <span>{formatNumber(tweet.retweets)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageCircle size={14} />
              <span>{formatNumber(tweet.replies)}</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span>{formatDate(new Date(tweet.createdAt))}</span>
            <a
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map((category: string) => (
              <span
                key={category}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Relevance Score */}
        {tweet.relevanceScore && (
          <div className="mt-3">
            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
              Relevance: {Math.round(tweet.relevanceScore * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      {hasAiAnalysis && (
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Brain size={20} className="text-purple-600" />
              <span>AI Analysis</span>
              <span className="text-xs text-gray-500">
                ({isThread ? "Thread View" : "Simple View"})
              </span>
            </h4>

            {/* Simple/Expert Toggle */}
            <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setShowSimpleView(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                  showSimpleView
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm transform scale-105"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Brain size={16} />
                <span>Simple</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    showSimpleView
                      ? "bg-white bg-opacity-30 text-blue-600"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isThread ? "4" : "3"}
                </span>
              </button>
              <button
                onClick={() => setShowSimpleView(false)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                  !showSimpleView
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm transform scale-105"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Microscope size={16} />
                <span>Expert</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    !showSimpleView
                      ? "bg-white bg-opacity-30 text-indigo-600"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  3
                </span>
              </button>
            </div>
          </div>

          {/* Analysis Content */}
          <AnimatePresence mode="wait">
            {showSimpleView ? (
              <motion.div
                key="simple"
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Title */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">
                    {isThread
                      ? "What this thread is about:"
                      : "What the author meant:"}
                  </h5>
                  <p className="text-blue-800">{aiAnalysis.simple.title}</p>
                </div>

                {/* Summary */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Summary:</h5>
                  <p className="text-green-800">{aiAnalysis.simple.summary}</p>
                </div>

                {/* Viewpoints (Thread only) */}
                {isThread && aiAnalysis.simple.viewpoints && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-2">
                      Main viewpoints:
                    </h5>
                    <p className="text-yellow-800">
                      {aiAnalysis.simple.viewpoints}
                    </p>
                  </div>
                )}

                {/* Terms (Single tweet only) */}
                {!isThread && aiAnalysis.simple.terms && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-2">
                      Key terms explained:
                    </h5>
                    <p className="text-yellow-800">{aiAnalysis.simple.terms}</p>
                  </div>
                )}

                {/* Why it matters */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-2">
                    {isThread
                      ? "Why this discussion matters:"
                      : "Why it matters:"}
                  </h5>
                  <p className="text-purple-800">
                    {aiAnalysis.simple.why_matters}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expert"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Expert Summary */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h5 className="font-medium text-indigo-900 mb-2">
                    Expert Summary:
                  </h5>
                  <p className="text-indigo-800">{aiAnalysis.expert.summary}</p>
                </div>

                {/* Impact Level */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900 mb-2">
                    Impact Level:
                  </h5>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      aiAnalysis.expert.impact_level === "high"
                        ? "bg-red-100 text-red-800"
                        : aiAnalysis.expert.impact_level === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {aiAnalysis.expert.impact_level.toUpperCase()}
                  </span>
                </div>

                {/* Project Impact */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Project Impact:
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Relevance Score:
                      </span>
                      <span className="ml-2 text-sm text-gray-800">
                        {aiAnalysis.expert.project_impact.relevance_score}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Description:
                      </span>
                      <p className="text-sm text-gray-800 mt-1">
                        {aiAnalysis.expert.project_impact.description}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Opportunities:
                      </span>
                      <p className="text-sm text-gray-800 mt-1">
                        {aiAnalysis.expert.project_impact.opportunities}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Threats:
                      </span>
                      <p className="text-sm text-gray-800 mt-1">
                        {aiAnalysis.expert.project_impact.threats}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Thread Analysis */}
      {hasThreadData && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span className="flex items-center space-x-2 text-gray-700">
              <MessageCircle size={16} />
              <span className="font-medium">
                Thread Analysis ({threadStructure.totalReplies} replies)
              </span>
            </span>
            {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-t border-gray-100"
              >
                <div className="p-4">
                  <ThreadDisplay
                    threadStructure={threadStructure}
                    threadAnalysis={isThread ? aiAnalysis : null}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
