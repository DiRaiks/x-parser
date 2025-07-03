import { create } from "zustand";
import { Tweet, Category, Settings } from "../types";

interface AppState {
  // Data
  tweets: Tweet[];
  categories: Category[];
  settings: Settings | null;

  // UI State
  isLoading: boolean;
  selectedTweet: Tweet | null;
  expandedTweets: Set<string>;
  currentFilter: string;

  // Actions
  setTweets: (tweets: Tweet[]) => void;
  addTweet: (tweet: Tweet) => void;
  updateTweet: (id: string, updates: Partial<Tweet>) => void;
  setCategories: (categories: Category[]) => void;
  setSettings: (settings: Settings) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedTweet: (tweet: Tweet | null) => void;
  toggleTweetExpansion: (tweetId: string) => void;
  setCurrentFilter: (filter: string) => void;
  toggleFavorite: (tweetId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  tweets: [],
  categories: [],
  settings: null,
  isLoading: false,
  selectedTweet: null,
  expandedTweets: new Set(),
  currentFilter: "all",

  // Actions
  setTweets: (tweets) => set({ tweets }),

  addTweet: (tweet) =>
    set((state) => ({
      tweets: [tweet, ...state.tweets],
    })),

  updateTweet: (id, updates) =>
    set((state) => ({
      tweets: state.tweets.map((tweet) =>
        tweet.id === id ? { ...tweet, ...updates } : tweet
      ),
    })),

  setCategories: (categories) => set({ categories }),

  setSettings: (settings) => set({ settings }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setSelectedTweet: (selectedTweet) => set({ selectedTweet }),

  toggleTweetExpansion: (tweetId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedTweets);
      if (newExpanded.has(tweetId)) {
        newExpanded.delete(tweetId);
      } else {
        newExpanded.add(tweetId);
      }
      return { expandedTweets: newExpanded };
    }),

  setCurrentFilter: (currentFilter) => set({ currentFilter }),

  toggleFavorite: (tweetId) =>
    set((state) => ({
      tweets: state.tweets.map((tweet) =>
        tweet.id === tweetId
          ? { ...tweet, isFavorite: !tweet.isFavorite }
          : tweet
      ),
    })),
}));
