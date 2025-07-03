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
}

export interface AIAnalysisResult {
  relevance_score: number;
  is_relevant: boolean;
  categories: string[];
  reason: string;
}

export interface ThreadAnalysisResult {
  total_replies: number;
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
}

export interface LidoImpactAnalysis {
  relevance_to_lido: string;
  main_tweet_impact: string;
  comments_impact: string;
  overall_impact: string;
  opportunities: string;
  threats: string;
}

export interface AISummaryResult {
  summary: string;
  expert_comment?: string;
  expert_commentary?: string;
  impact_level: "low" | "medium" | "high";
  lido_impact?: LidoImpactAnalysis;
  thread_analysis?: ThreadAnalysisResult;
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
