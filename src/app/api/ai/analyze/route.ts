import { NextRequest, NextResponse } from "next/server";
import { openai, SYSTEM_PROMPTS } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { reloadPromptsConfig } from "@/lib/config";
import {
  AIAnalysisResult,
  AISummaryResult,
  Reply,
  ThreadStructure,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Force reload prompts to ensure we have the latest version
    reloadPromptsConfig();

    const {
      tweetId,
      content,
      replies = [],
      threadStructure = null, // New: Enhanced thread structure
      debug = false,
      targetLang = "en",
    } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Tweet content is required" },
        { status: 400 }
      );
    }

    // Analyze enhanced thread if threadStructure is provided
    if (threadStructure) {
      return analyzeEnhancedThread(
        tweetId,
        content,
        threadStructure,
        debug,
        targetLang
      );
    }

    // Analyze thread if replies are provided (legacy support)
    if (replies.length > 0) {
      return analyzeThread(tweetId, content, replies, debug, targetLang);
    }

    // Step 1: Check relevance
    const relevanceResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.RELEVANCE_CHECKER },
        { role: "user", content: content },
      ],
      temperature: 0.3,
    });

    const relevanceResult: AIAnalysisResult = JSON.parse(
      relevanceResponse.choices[0].message.content || "{}"
    );

    let translation = "";
    let summaryResult: AISummaryResult | null = null;

    if (relevanceResult.is_relevant) {
      // Step 2: Translate if relevant
      const translatorPrompt = SYSTEM_PROMPTS.TRANSLATOR(targetLang);
      const translationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: translatorPrompt },
          { role: "user", content: content },
        ],
        temperature: 0.1,
      });

      translation = translationResponse.choices[0].message.content || "";

      // Step 3: Summarize
      const summarizerPrompt = SYSTEM_PROMPTS.SUMMARIZER(targetLang);
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: summarizerPrompt },
          { role: "user", content: content },
        ],
        temperature: 0.5,
      });

      try {
        summaryResult = JSON.parse(
          summaryResponse.choices[0].message.content || "{}"
        );
      } catch {
        summaryResult = {
          summary: "Failed to parse summary",
          impact_level: "low" as const,
          nested_discussion_summary: "No analysis available",
          key_debate_points: [],
          consensus_areas: [],
          disagreement_areas: [],
        };
      }
    }

    if (!debug) {
      const updatedTweet = await prisma.tweet.update({
        where: { tweetId },
        data: {
          isRelevant: relevanceResult.is_relevant,
          relevanceScore: relevanceResult.relevance_score,
          categories: JSON.stringify(relevanceResult.categories),
          translation: translation,
          summary: summaryResult?.summary || "",
          aiComments: summaryResult ? JSON.stringify(summaryResult) : "",
          isProcessed: true,
        },
      });

      return NextResponse.json({
        success: true,
        tweet: updatedTweet,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: summaryResult,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        debug: true,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: summaryResult,
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing tweet:", error);
    return NextResponse.json(
      { error: "Failed to analyze tweet" },
      { status: 500 }
    );
  }
}

// Enhanced thread analysis for hierarchical structure
async function analyzeEnhancedThread(
  tweetId: string,
  mainTweet: string,
  threadStructure: ThreadStructure,
  debug: boolean = false,
  targetLang: string = "en"
) {
  try {
    // Force reload prompts to ensure we have the latest version
    reloadPromptsConfig();

    const { replies, replyTree, participants, maxDepth, totalReplies } =
      threadStructure;

    // Create comprehensive thread context for AI analysis
    // Use replyTree if available, otherwise fall back to replies, or empty array
    let effectiveReplyTree: Reply[] = [];
    if (Array.isArray(replyTree) && replyTree.length > 0) {
      effectiveReplyTree = replyTree;
    } else if (Array.isArray(replies) && replies.length > 0) {
      effectiveReplyTree = replies;
    } else {
      effectiveReplyTree = []; // Empty array for tweets with no replies
    }

    const threadContext = createEnhancedThreadContext(
      mainTweet,
      effectiveReplyTree,
      participants,
      maxDepth
    );

    // 1. Check relevance of the main tweet
    const relevanceResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.RELEVANCE_CHECKER },
        { role: "user", content: mainTweet },
      ],
      temperature: 0.3,
    });

    const relevanceResult: AIAnalysisResult = JSON.parse(
      relevanceResponse.choices[0].message.content || "{}"
    );

    if (!relevanceResult.is_relevant) {
      if (!debug) {
        const updatedTweet = await prisma.tweet.update({
          where: { tweetId },
          data: {
            isRelevant: false,
            relevanceScore: relevanceResult.relevance_score,
            categories: JSON.stringify(relevanceResult.categories),
            repliesData: JSON.stringify(threadStructure),
            isProcessed: true,
          },
        });

        return NextResponse.json({
          success: true,
          tweet: updatedTweet,
          analysis: { relevance: relevanceResult },
        });
      } else {
        return NextResponse.json({
          success: true,
          debug: true,
          analysis: { relevance: relevanceResult },
        });
      }
    }

    // 2. Translate main tweet
    const translatorPrompt = SYSTEM_PROMPTS.TRANSLATOR(targetLang);
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: translatorPrompt },
        { role: "user", content: mainTweet },
      ],
      temperature: 0.1,
    });

    const translation = translationResponse.choices[0].message.content || "";

    // 3. Enhanced thread analysis with nested discussion understanding
    const enhancedThreadAnalyzerPrompt =
      SYSTEM_PROMPTS.THREAD_ANALYZER(targetLang);

    const threadAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: enhancedThreadAnalyzerPrompt },
        { role: "user", content: threadContext },
      ],
      temperature: 0.4,
      max_tokens: 2000, // Increased for detailed analysis
    });

    let threadAnalysis;
    try {
      let content = threadAnalysisResponse.choices[0].message.content || "{}";

      // Clean up markdown formatting if present
      if (content.includes("```json")) {
        content = content.replace(/```json\s*/, "").replace(/\s*```/, "");
      }

      threadAnalysis = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse thread analysis JSON:", parseError);
      console.error(
        "Raw content:",
        threadAnalysisResponse.choices[0].message.content
      );
      // Enhanced fallback analysis
      threadAnalysis = createFallbackThreadAnalysis(
        replies,
        participants,
        maxDepth
      );
    }

    // 4. Validate and fix sentiment analysis
    const sentiment = threadAnalysis.comment_sentiment || {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    };

    // Ensure sentiment counts match total comments
    const sentimentTotal =
      sentiment.positive +
      sentiment.negative +
      sentiment.neutral +
      sentiment.mixed;
    if (sentimentTotal !== totalReplies) {
      // Redistribute the difference to neutral comments
      const difference = totalReplies - sentimentTotal;
      if (difference > 0) {
        sentiment.neutral += difference;
      } else if (difference < 0) {
        // If AI counted more than actual comments, reduce neutral
        const excess = Math.abs(difference);
        sentiment.neutral = Math.max(0, sentiment.neutral - excess);
      }
    }

    // 4. Create comprehensive enhanced summary
    const comprehensiveSummary = {
      summary: threadAnalysis.thread_summary || "",
      expert_commentary: threadAnalysis.main_tweet_analysis || "",
      impact_level: threadAnalysis.impact_assessment || "medium",
      project_impact: threadAnalysis.project_impact || {
        current_state: "neutral",
        potential_risks: [],
        potential_opportunities: [],
      },
      thread_analysis: {
        total_replies: totalReplies,
        max_depth: maxDepth,
        sentiment_breakdown: sentiment,
        key_reactions: threadAnalysis.key_reactions || [],
        trending_topics: threadAnalysis.trending_topics || [],
        community_pulse: threadAnalysis.community_pulse || "",
        controversial_points: threadAnalysis.controversial_points || [],
        reply_chains: threadAnalysis.reply_chains || [],
        influencer_engagement: threadAnalysis.influencer_engagement || [],
        discussion_patterns: threadAnalysis.discussion_patterns || {
          debate_intensity: 5,
          echo_chamber_score: 5,
          new_information_score: 5,
        },
      },
      nested_discussion_summary: threadAnalysis.nested_discussion_summary || "",
      key_debate_points: threadAnalysis.key_debate_points || [],
      consensus_areas: threadAnalysis.consensus_areas || [],
      disagreement_areas: threadAnalysis.disagreement_areas || [],
    };

    if (!debug) {
      const updatedTweet = await prisma.tweet.update({
        where: { tweetId },
        data: {
          isRelevant: true,
          relevanceScore: relevanceResult.relevance_score,
          categories: JSON.stringify(relevanceResult.categories),
          translation: translation,
          summary: threadAnalysis.thread_summary,
          aiComments: JSON.stringify(comprehensiveSummary),
          repliesData: JSON.stringify(threadStructure),
          isProcessed: true,
        },
      });

      return NextResponse.json({
        success: true,
        tweet: updatedTweet,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: comprehensiveSummary,
          threadAnalysis,
          threadStructure,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        debug: true,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: comprehensiveSummary,
          threadAnalysis,
          threadStructure,
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing enhanced thread:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    // console.error(
    //   "Thread structure:",
    //   JSON.stringify(threadStructure, null, 2)
    // );

    return NextResponse.json(
      {
        error: "Failed to analyze enhanced thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to create enhanced thread context for AI analysis
function createEnhancedThreadContext(
  mainTweet: string,
  replyTree: Reply[],
  participants: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  maxDepth: number
): string {
  let context = `MAIN TWEET:\n${mainTweet}\n\n`;

  context += `DISCUSSION STRUCTURE (max depth: ${maxDepth}):\n`;
  context += formatReplyTreeForAnalysis(replyTree, 0);

  context += `\nPARTICIPANTS:\n`;
  participants.forEach((p, index) => {
    context += `${index + 1}. @${p.username} (${p.name}) - ${
      p.replyCount
    } replies, ${p.totalLikes} likes\n`;
  });

  return context;
}

// Helper function to format reply tree for AI analysis
function formatReplyTreeForAnalysis(replies: Reply[], depth: number): string {
  let result = "";
  const indent = "  ".repeat(depth);

  for (const reply of replies) {
    const likes = reply.likes > 0 ? ` (👍 ${reply.likes})` : "";
    const replyTo = reply.replyToUserId
      ? ` replying to @${reply.replyToUserId}`
      : "";

    result += `${indent}├─ @${reply.authorUsername}${replyTo}: ${reply.content}${likes}\n`;

    if (reply.children.length > 0) {
      result += formatReplyTreeForAnalysis(reply.children, depth + 1);
    }
  }

  return result;
}

// Helper function to create fallback analysis
function createFallbackThreadAnalysis(
  replies: Reply[],
  participants: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  maxDepth: number
) {
  // Count total comments including nested ones
  const countTotalComments = (replyList: Reply[]): number => {
    let count = 0;
    for (const reply of replyList) {
      count += 1; // Count this reply
      if (reply.children.length > 0) {
        count += countTotalComments(reply.children); // Count nested replies
      }
    }
    return count;
  };

  const totalComments = countTotalComments(replies);

  // Calculate sentiment distribution ensuring total matches
  const positive = Math.max(1, Math.floor(totalComments * 0.1));
  const negative = Math.floor(totalComments * 0.2);
  const neutral = Math.floor(totalComments * 0.6);
  const mixed = totalComments - positive - negative - neutral; // Ensure total matches

  return {
    thread_summary: `Discussion with ${totalComments} replies (depth: ${maxDepth})`,
    main_tweet_analysis: "Main tweet analysis",
    comment_sentiment: {
      positive,
      negative,
      neutral,
      mixed,
    },
    key_reactions: ["General discussion"],
    trending_topics: ["cryptocurrencies"],
    community_pulse: "Neutral",
    controversial_points: [],
    reply_chains: [],
    influencer_engagement: participants.slice(0, 3).map((p) => ({
      username: p.username,
      follower_tier:
        p.replyCount > 3 ? "high" : p.replyCount > 1 ? "medium" : "low",
      sentiment: "neutral",
      reply_count: p.replyCount,
    })),
    discussion_patterns: {
      debate_intensity: 5,
      echo_chamber_score: 5,
      new_information_score: 5,
    },
    nested_discussion_summary: "Multi-level comment analysis unavailable",
    key_debate_points: [],
    consensus_areas: [],
    disagreement_areas: [],
    impact_assessment: "medium",
    project_impact: {
      relevance_to_project: "Relevance not determined",
      main_tweet_impact: "No specific impact identified",
      comments_impact: "General discussion",
      overall_impact: "No specific impact identified",
      opportunities: "No specific opportunities identified",
      threats: "No specific threats identified",
    },
  };
}

// Keep existing analyzeThread function for backward compatibility
async function analyzeThread(
  tweetId: string,
  mainTweet: string,
  replies: unknown[],
  debug: boolean = false,
  targetLang: string = "en"
) {
  try {
    if (debug) {
    }

    // Create thread context for AI analysis - simplified
    const threadContext = `
${targetLang === "ru" ? "ОСНОВНОЙ ТВИТ" : "MAIN TWEET"}:
${mainTweet}

${
  targetLang === "ru"
    ? `КОММЕНТАРИИ (${replies.length} комментариев)`
    : `COMMENTS (${replies.length} comments)`
}:
${replies
  .map((reply: unknown, index: number) => {
    const replyData = reply as {
      authorUsername?: string;
      content?: string;
      likes?: number;
    };
    return `${index + 1}. @${replyData.authorUsername || "unknown"}: ${
      replyData.content || ""
    } (👍 ${replyData.likes || 0})`;
  })
  .join("\n")}
`;

    // 1. Check relevance of the main tweet
    const relevanceResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.RELEVANCE_CHECKER },
        { role: "user", content: mainTweet },
      ],
      temperature: 0.3,
    });

    const relevanceResult: AIAnalysisResult = JSON.parse(
      relevanceResponse.choices[0].message.content || "{}"
    );

    if (!relevanceResult.is_relevant) {
      if (!debug) {
        const updatedTweet = await prisma.tweet.update({
          where: { tweetId },
          data: {
            isRelevant: false,
            relevanceScore: relevanceResult.relevance_score,
            categories: JSON.stringify(relevanceResult.categories),
            isProcessed: true,
          },
        });

        return NextResponse.json({
          success: true,
          tweet: updatedTweet,
          analysis: { relevance: relevanceResult },
        });
      } else {
        return NextResponse.json({
          success: true,
          debug: true,
          analysis: { relevance: relevanceResult },
        });
      }
    }

    // 2. Translate main tweet
    const translatorPrompt = SYSTEM_PROMPTS.TRANSLATOR(targetLang);
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: translatorPrompt },
        { role: "user", content: mainTweet },
      ],
      temperature: 0.1,
    });

    const translation = translationResponse.choices[0].message.content || "";

    // 3. Analyze the full thread with complete analysis in one request
    const threadAnalyzerPrompt = SYSTEM_PROMPTS.THREAD_ANALYZER(targetLang);

    const threadAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: threadAnalyzerPrompt },
        { role: "user", content: threadContext },
      ],
      temperature: 0.4,
    });

    let threadAnalysis;
    try {
      threadAnalysis = JSON.parse(
        threadAnalysisResponse.choices[0].message.content || "{}"
      );
    } catch (parseError) {
      console.error("Failed to parse thread analysis JSON:", parseError);
      // Fallback analysis
      threadAnalysis = {
        main_tweet_analysis:
          targetLang === "ru"
            ? "Анализ основного твита"
            : "Main tweet analysis",
        comment_sentiment: { positive: 1, negative: 0, neutral: 1, mixed: 0 },
        key_reactions: [
          targetLang === "ru" ? "Положительная реакция" : "Positive reaction",
        ],
        trending_topics: [
          targetLang === "ru" ? "криптовалюты" : "cryptocurrencies",
        ],
        community_pulse: targetLang === "ru" ? "Позитивное" : "Positive",
        thread_summary:
          targetLang === "ru"
            ? "Обсуждение криптовалютных новостей"
            : "Crypto news discussion",
        impact_assessment: "medium",
        controversial_points: [],
        project_impact: {
          relevance_to_project: "0",
          main_tweet_impact: "No specific impact identified",
          comments_impact: "No comments to analyze",
          overall_impact: "No specific impact identified",
          opportunities: "No specific opportunities identified",
          threats: "No specific threats identified",
        },
      };
    }

    // Thread analysis completed

    // 4. Create comprehensive summary
    const comprehensiveSummary = {
      summary: threadAnalysis.thread_summary,
      expert_commentary: threadAnalysis.main_tweet_analysis,
      impact_level: threadAnalysis.impact_assessment,
      project_impact: threadAnalysis.project_impact,
      thread_analysis: {
        total_replies: replies.length,
        max_depth: 1, // Legacy analysis assumes flat structure
        sentiment_breakdown: threadAnalysis.comment_sentiment,
        key_reactions: threadAnalysis.key_reactions || [],
        trending_topics: threadAnalysis.trending_topics || [],
        community_pulse: threadAnalysis.community_pulse,
        controversial_points: threadAnalysis.controversial_points || [],
        reply_chains: [],
        influencer_engagement: [],
        discussion_patterns: {
          debate_intensity: 5,
          echo_chamber_score: 5,
          new_information_score: 5,
        },
      },
      nested_discussion_summary: "Legacy flat structure analysis",
      key_debate_points: [],
      consensus_areas: [],
      disagreement_areas: [],
    };

    if (!debug) {
      const updatedTweet = await prisma.tweet.update({
        where: { tweetId },
        data: {
          isRelevant: true,
          relevanceScore: relevanceResult.relevance_score,
          categories: JSON.stringify(relevanceResult.categories),
          translation: translation,
          summary: threadAnalysis.thread_summary,
          aiComments: JSON.stringify(comprehensiveSummary),
          isProcessed: true,
        },
      });

      // Thread analysis completed successfully

      return NextResponse.json({
        success: true,
        tweet: updatedTweet,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: comprehensiveSummary,
          threadAnalysis,
        },
      });
    } else {
      // Debug mode - skipping database update

      return NextResponse.json({
        success: true,
        debug: true,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: comprehensiveSummary,
          threadAnalysis,
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing thread:", error);
    console.error("Thread context:", JSON.stringify(replies, null, 2));

    return NextResponse.json(
      { error: "Failed to analyze thread" },
      { status: 500 }
    );
  }
}
