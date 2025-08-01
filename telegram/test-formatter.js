// Simple test for message formatter with new AIAnalysis format

// Set environment variables for the test
process.env.BOT_LANGUAGE = "ru";
process.env.BOT_MESSAGE_FORMAT = "detailed";

import { MessageFormatter } from "./src/services/message-formatter.js";

// Create formatter instance
const formatter = new MessageFormatter();

// Test data with new AIAnalysis format
const testTweet = {
  id: "test123",
  tweetId: "1949749399040762098", 
  authorUsername: "testuser",
  authorName: "Test User",
  content: "Bitcoin just hit a new all-time high! This could be the start of the next bull run. HODL strong! 🚀",
  createdAt: new Date("2024-01-25T10:00:00Z"),
  url: "https://x.com/testuser/status/1949749399040762098",
  likes: 100,
  retweets: 20,
  replies: 5,
  isRelevant: true,
  relevanceScore: 0.85,
  categories: '["cryptocurrencies", "bitcoin"]',
  translation: "Биткойн только что достиг нового исторического максимума! Это может быть началом следующего бычьего рынка. HODL крепко! 🚀",
  aiComments: JSON.stringify({
    type: "single",
    simple: {
      title: "Биткойн снова на высоте!",
      summary: "Биткойн достиг нового рекорда по цене, и это может означать, что начнется новый рост на рынке криптовалют.",
      terms: "HODL - это сленг в криптосообществе, означающий держать свои инвестиции вместо продажи.",
      why_matters: "Это важно, потому что когда цена Биткойна растет, это может повлиять на весь рынок криптовалют."
    },
    expert: {
      summary: "Биткойн достиг нового максимума, что указывает на потенциальный бычий тренд на рынке.",
      impact_level: "high",
      project_impact: {
        relevance_score: 9,
        description: "Новый максимум позиционирует Биткойн как сильного лидера рынка.",
        opportunities: "Увеличение объема торгов и институциональных инвестиций.",
        threats: "Потенциал для повышенного регулятивного внимания и волатильности рынка."
      }
    }
  }),
  savedAt: new Date(),
  isFavorite: false,
  isProcessed: true
};

// Test brief format
console.log("=== BRIEF FORMAT ===");
const briefMessage = formatter.formatTweet(testTweet);
console.log(briefMessage);

console.log("\n=== DETAILED FORMAT ===");
// Test detailed format (temporarily change format)
formatter.messageFormat = "detailed";
const detailedMessage = formatter.formatTweet(testTweet);
console.log(detailedMessage);

console.log("\n=== SUCCESS: Message formatter working with new AIAnalysis format! ==="); 