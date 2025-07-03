import { NextRequest, NextResponse } from "next/server";
import { openai, SYSTEM_PROMPTS } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { AIAnalysisResult, AISummaryResult } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const {
      tweetId,
      content,
      replies = [],
      debug = false,
      targetLang = "en",
    } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Tweet content is required" },
        { status: 400 }
      );
    }

    // Basic validation logging only for errors
    if (debug) {
    }

    // Analyze thread if replies are provided
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

    // Step 2: If relevant, translate and summarize
    if (relevanceResult.is_relevant) {
      // Translate
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

      // Summarize
      const summarizerPrompt = SYSTEM_PROMPTS.SUMMARIZER(targetLang);
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: summarizerPrompt },
          { role: "user", content: content },
        ],
        temperature: 0.5,
      });

      summaryResult = JSON.parse(
        summaryResponse.choices[0].message.content || "{}"
      );
    }

    if (!debug) {
      // Step 3: Update tweet in database
      const updatedTweet = await prisma.tweet.update({
        where: { tweetId },
        data: {
          isRelevant: relevanceResult.is_relevant,
          relevanceScore: relevanceResult.relevance_score,
          categories: JSON.stringify(relevanceResult.categories),
          translation: translation || null,
          summary: summaryResult?.summary || null,
          aiComments: summaryResult ? JSON.stringify(summaryResult) : null,
          isProcessed: true,
        },
      });

      // Analysis completed successfully

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
      // Debug mode - skipping database update
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
        lido_impact: {
          relevance_to_lido: "0",
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
      lido_impact: threadAnalysis.lido_impact,
      thread_analysis: {
        total_replies: replies.length,
        sentiment_breakdown: threadAnalysis.comment_sentiment,
        key_reactions: threadAnalysis.key_reactions || [],
        trending_topics: threadAnalysis.trending_topics || [],
        community_pulse: threadAnalysis.community_pulse,
        controversial_points: threadAnalysis.controversial_points || [],
      },
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
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      {
        error: `Failed to analyze thread: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
