export interface Tweet {
  id: string;
  tweetId: string;
  authorUsername: string;
  authorName: string;
  content: string;
  createdAt: Date;
  url: string;
  likes: number;
  retweets: number;
  replies: number;

  // AI Analysis
  isRelevant: boolean;
  relevanceScore?: number;
  categories?: string;
  translation?: string;
  summary?: string;
  aiComments?: string;
  repliesData?: string;

  // App metadata
  savedAt: Date;
  isFavorite: boolean;
  isProcessed: boolean;
}

export interface Reply {
  tweetId: string;
  authorUsername: string;
  authorName: string;
  content: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  source: string;

  // New fields for nested structure
  parentId?: string; // ID of the tweet this is replying to
  replyToUserId?: string; // Username this reply is responding to
  depth: number; // Nesting level (0 = direct reply to main tweet)
  children: Reply[]; // Nested replies to this reply
  conversationId: string; // Main tweet ID this whole thread belongs to
}

export interface ThreadStructure {
  mainTweet: Tweet;
  totalReplies: number;
  maxDepth: number;
  replies: Reply[];
  replyTree: Reply[]; // Hierarchical structure
  participants: {
    username: string;
    name: string;
    replyCount: number;
    totalLikes: number;
  }[];
}

export interface Category {
  id: string;
  name: string;
  keywords: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Settings {
  id: string;
  openaiApiKey?: string;
  targetLanguage: string;
  maxTweetsPerFetch: number;
  fetchInterval: number;
  updatedAt: Date;

  // New settings for enhanced parsing
  maxRepliesDepth: number; // Maximum nesting level to parse
  maxRepliesPerLevel: number; // Maximum replies to fetch per level
  includeReplyChains: boolean; // Whether to fetch full reply chains
}

export interface AIAnalysisResult {
  relevance_score: number;
  is_relevant: boolean;
  categories: string[];
  reason: string;
}

export interface ThreadAnalysisResult {
  total_replies: number;
  max_depth: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  key_reactions: string[];
  trending_topics: string[];
  community_pulse: string;
  controversial_points: string[];

  // New enhanced analysis
  reply_chains: {
    depth: number;
    participant_count: number;
    main_topic: string;
    sentiment: string;
  }[];
  influencer_engagement: {
    username: string;
    follower_tier: string; // high/medium/low based on engagement
    sentiment: string;
    reply_count: number;
  }[];
  discussion_patterns: {
    debate_intensity: number; // 1-10 scale
    echo_chamber_score: number; // How much agreement vs disagreement
    new_information_score: number; // How much new info is shared
  };
}

export interface ProjectImpactAnalysis {
  relevance_to_project: string;
  main_tweet_impact: string;
  comments_impact: string;
  overall_impact: string;
  opportunities: string;
  threats: string;

  // Enhanced analysis
  reply_chain_insights: string[];
  community_sentiment: string;
  competitive_mentions: string[];
}

export interface AISummaryResult {
  summary: string;
  expert_comment?: string;
  expert_commentary?: string;
  impact_level: "low" | "medium" | "high";
  project_impact?: ProjectImpactAnalysis;
  thread_analysis?: ThreadAnalysisResult;

  // New fields for enhanced analysis
  nested_discussion_summary: string;
  key_debate_points: string[];
  consensus_areas: string[];
  disagreement_areas: string[];
}

export interface TweetParseData {
  id: string;
  username: string;
  name: string;
  content: string;
  timestamp: string;
  url: string;
  stats: {
    likes: number;
    retweets: number;
    replies: number;
  };
}
