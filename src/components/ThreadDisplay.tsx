"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Users,
  ExternalLink,
  Heart,
  Repeat2,
  BarChart3,
} from "lucide-react";
import { Reply, ThreadStructure } from "@/types";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

interface ThreadDisplayProps {
  threadStructure: ThreadStructure;
}

interface ReplyNodeProps {
  reply: Reply;
  depth: number;
  maxDepth: number;
}

export default function ThreadDisplay({ threadStructure }: ThreadDisplayProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const { replyTree, participants, totalReplies, maxDepth } = threadStructure;

  const topParticipants = participants
    .sort((a, b) => b.replyCount - a.replyCount)
    .slice(0, 5);

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
      {/* Thread Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-indigo-700">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{totalReplies} replies</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-700">
            <BarChart3 className="w-4 h-4" />
            <span>Max depth: {maxDepth}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-indigo-700">
            <Users className="w-4 h-4" />
            <span>{participants.length} participants</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            {showParticipants ? "Hide" : "Show"} Participants
          </button>
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <span>{showReplies ? "Hide" : "Show"} Thread</span>
            {showReplies ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Participants Display */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-white rounded-lg border border-purple-200"
          >
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Top Participants
            </h4>
            <div className="space-y-2">
              {topParticipants.map((participant) => (
                <div
                  key={participant.username}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {participant.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        @{participant.username}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {participant.replyCount} replies • {participant.totalLikes}{" "}
                    likes
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thread Display */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-indigo-200 max-h-96 overflow-y-auto"
          >
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-indigo-600" />
                Thread Discussion
              </h4>

              {replyTree.length > 0 ? (
                <div className="space-y-3">
                  {replyTree.map((reply) => (
                    <ReplyNode
                      key={reply.tweetId}
                      reply={reply}
                      depth={0}
                      maxDepth={maxDepth}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No replies found in this thread
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reply Node Component for hierarchical display
function ReplyNode({ reply, depth, maxDepth }: ReplyNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 2); // Auto-collapse deep replies
  const indentLevel = Math.min(depth, 4); // Limit visual indentation
  const hasChildren = reply.children.length > 0;

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getDepthColor = (depth: number) => {
    const colors = [
      "border-l-blue-300",
      "border-l-indigo-300",
      "border-l-purple-300",
      "border-l-pink-300",
      "border-l-orange-300",
    ];
    return colors[depth % colors.length];
  };

  return (
    <div
      className={clsx(
        "pl-4 border-l-2",
        getDepthColor(depth),
        indentLevel > 0 && `ml-${indentLevel * 2}`
      )}
    >
      <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
        {/* Reply Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {reply.authorUsername.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-medium text-sm text-gray-900">
                {reply.authorName}
              </span>
              <span className="text-xs text-gray-500">
                @{reply.authorUsername}
              </span>
              {reply.replyToUserId && (
                <>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs text-blue-600 font-medium">
                    @{reply.replyToUserId}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {formatDate(reply.createdAt)}
            </span>
            {hasChildren && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50"
              >
                {collapsed ? `+${reply.children.length}` : "−"}
              </button>
            )}
          </div>
        </div>

        {/* Reply Content */}
        <div className="mb-2">
          <p className="text-sm text-gray-900 leading-relaxed">
            {reply.content}
          </p>
        </div>

        {/* Reply Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{reply.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Repeat2 className="w-3 h-3" />
              <span>{reply.retweets}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{reply.replies}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-600">
              Depth: {reply.depth}
            </span>
            <a
              href={`https://x.com/${reply.authorUsername}/status/${reply.tweetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors"
              title="View on X"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Nested Replies */}
        {hasChildren && !collapsed && (
          <div className="mt-3 space-y-2">
            {reply.children.map((childReply) => (
              <ReplyNode
                key={childReply.tweetId}
                reply={childReply}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
