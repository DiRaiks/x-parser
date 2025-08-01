"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  User,
  Clock,
  Heart,
  Repeat2,
  Eye,
  EyeOff,
  Brain,
  Microscope,
} from "lucide-react";
import { ThreadStructure, Reply, AIAnalysis } from "@/types";

interface ThreadDisplayProps {
  threadStructure: ThreadStructure;
  threadAnalysis?: AIAnalysis | null;
}

interface ReplyNodeProps {
  reply: Reply;
  depth: number;
  maxDepth: number;
  isAuthorThread?: boolean;
  getThreadNumber?: (
    content: string
  ) => { current: number; total: number } | null;
}

export default function ThreadDisplay({
  threadStructure,
  threadAnalysis,
}: ThreadDisplayProps) {
  const [showThreadAnalysis, setShowThreadAnalysis] = useState(false);
  const [showSimpleView, setShowSimpleView] = useState(true);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const { mainTweet, replyTree, participants } = threadStructure;

  // Determine if this is an author thread
  const mainAuthor = mainTweet?.authorUsername;
  const authorReplies = mainAuthor
    ? replyTree.filter((reply) => reply.authorUsername === mainAuthor)
    : [];
  const isAuthorThread =
    mainAuthor &&
    authorReplies.length > 0 &&
    authorReplies.length / replyTree.length > 0.6;

  // Helper function to extract thread numbers (e.g., "1/5", "2/5")
  const getThreadNumber = (content: string) => {
    const match = content.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        current: parseInt(match[1]),
        total: parseInt(match[2]),
      };
    }
    return null;
  };

  const ReplyNode: React.FC<ReplyNodeProps> = ({
    reply,
    depth,
    maxDepth,
    isAuthorThread: isAuthorThreadProp,
    getThreadNumber: getThreadNumberProp,
  }) => {
    const threadNumber =
      isAuthorThreadProp &&
      getThreadNumberProp &&
      reply.authorUsername === mainAuthor
        ? getThreadNumberProp(reply.content)
        : null;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: depth * 0.1 }}
        className={`border-l-2 border-gray-200 ${
          depth > 0 ? "ml-4 pl-4" : "pl-4"
        }`}
      >
        <div className="bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          {/* Reply Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-500" />
              <span className="font-medium text-gray-900">
                {reply.authorName}
              </span>
              <span className="text-sm text-gray-500">
                @{reply.authorUsername}
              </span>
              {threadNumber && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {threadNumber.current}/{threadNumber.total}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Reply Content */}
          <p className="text-gray-800 mb-3 leading-relaxed">{reply.content}</p>

          {/* Reply Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Heart size={14} />
              <span>{reply.likes}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Repeat2 size={14} />
              <span>{reply.retweets}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageCircle size={14} />
              <span>{reply.replies}</span>
            </span>
          </div>
        </div>

        {/* Nested Replies */}
        {reply.children && reply.children.length > 0 && depth < maxDepth && (
          <div className="ml-4">
            {reply.children.map((childReply) => (
              <ReplyNode
                key={childReply.tweetId}
                reply={childReply}
                depth={depth + 1}
                maxDepth={maxDepth}
                isAuthorThread={isAuthorThreadProp}
                getThreadNumber={getThreadNumberProp}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Thread Analysis Section */}
      {threadAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowThreadAnalysis(!showThreadAnalysis)}
              className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors duration-200"
            >
              <Brain size={20} className="text-purple-600" />
              <span className="font-medium">
                {showThreadAnalysis ? "Hide" : "Show"} AI Analysis
              </span>
              {showThreadAnalysis ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {showThreadAnalysis && (
              <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setShowSimpleView(true)}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                    showSimpleView
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Brain size={16} />
                  <span>Simple</span>
                </button>
                <button
                  onClick={() => setShowSimpleView(false)}
                  className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                    !showSimpleView
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Microscope size={16} />
                  <span>Expert</span>
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showThreadAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  {showSimpleView ? (
                    <motion.div
                      key="simple"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Thread Title */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2">
                          What this thread is about:
                        </h5>
                        <p className="text-blue-800">
                          {threadAnalysis.simple.title}
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2">
                          Summary:
                        </h5>
                        <p className="text-green-800">
                          {threadAnalysis.simple.summary}
                        </p>
                      </div>

                      {/* Viewpoints */}
                      {threadAnalysis.simple.viewpoints && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h5 className="font-medium text-yellow-900 mb-2">
                            Main viewpoints:
                          </h5>
                          <p className="text-yellow-800">
                            {threadAnalysis.simple.viewpoints}
                          </p>
                        </div>
                      )}

                      {/* Why it matters */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-2">
                          Why this discussion matters:
                        </h5>
                        <p className="text-purple-800">
                          {threadAnalysis.simple.why_matters}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="expert"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Expert Summary */}
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h5 className="font-medium text-indigo-900 mb-2">
                          Expert Summary:
                        </h5>
                        <p className="text-indigo-800">
                          {threadAnalysis.expert.summary}
                        </p>
                      </div>

                      {/* Thread Metrics */}
                      {threadAnalysis.thread_data && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">
                            Thread Metrics:
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Replies:
                              </span>
                              <span className="ml-2 text-sm text-gray-800">
                                {threadAnalysis.thread_data.total_replies}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Max Depth:
                              </span>
                              <span className="ml-2 text-sm text-gray-800">
                                {threadAnalysis.thread_data.max_depth}
                              </span>
                            </div>
                          </div>

                          {/* Sentiment Breakdown */}
                          <div className="mt-4">
                            <span className="text-sm font-medium text-gray-700">
                              Sentiment:
                            </span>
                            <div className="mt-2 flex space-x-2">
                              {Object.entries(
                                threadAnalysis.thread_data.sentiment
                              ).map(([type, count]) => (
                                <span
                                  key={type}
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    type === "positive"
                                      ? "bg-green-100 text-green-800"
                                      : type === "negative"
                                      ? "bg-red-100 text-red-800"
                                      : type === "mixed"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {type}: {count}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Community Pulse */}
                          {threadAnalysis.thread_data.community_pulse && (
                            <div className="mt-4">
                              <span className="text-sm font-medium text-gray-700">
                                Community Pulse:
                              </span>
                              <p className="text-sm text-gray-800 mt-1">
                                {threadAnalysis.thread_data.community_pulse}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Project Impact */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h5 className="font-medium text-orange-900 mb-2">
                          Impact Level:
                        </h5>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            threadAnalysis.expert.impact_level === "high"
                              ? "bg-red-100 text-red-800"
                              : threadAnalysis.expert.impact_level === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {threadAnalysis.expert.impact_level.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Thread Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <MessageCircle size={20} className="text-blue-600" />
          <span>Thread Replies</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            {replyTree.length}
          </span>
          {Boolean(isAuthorThread) && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              📝 Author Thread
            </span>
          )}
        </h3>
        <div className="text-sm text-gray-500">
          {participants.length} participants • {threadStructure.maxDepth} levels
          deep
        </div>
      </div>

      {/* Reply Tree - Scrollable Container */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-4">
        <div className="space-y-4">
          {/* Show limited replies or all based on state */}
          {(showAllReplies ? replyTree : replyTree.slice(0, 5)).map((reply) => (
            <ReplyNode
              key={reply.tweetId}
              reply={reply}
              depth={0}
              maxDepth={threadStructure.maxDepth}
              isAuthorThread={Boolean(isAuthorThread)}
              getThreadNumber={getThreadNumber}
            />
          ))}
        </div>

        {/* Show more/less button */}
        {replyTree.length > 5 && (
          <div className="text-center mt-4 py-2 border-t border-gray-200">
            <button
              onClick={() => setShowAllReplies(!showAllReplies)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              {showAllReplies
                ? `↑ Show less (showing all ${replyTree.length})`
                : `↓ Show ${replyTree.length - 5} more replies`}
            </button>
          </div>
        )}

        {/* Scroll indicator for scrollable content */}
        {showAllReplies && replyTree.length > 8 && (
          <div className="text-center text-xs text-gray-500 mt-2 py-2 border-t border-gray-200">
            ↕️ Scroll to navigate replies
          </div>
        )}
      </div>
    </div>
  );
}
