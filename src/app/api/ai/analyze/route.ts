import { NextRequest, NextResponse } from "next/server";
import { openai, SYSTEM_PROMPTS } from "@/lib/openai";
import { reloadPromptsConfig, getAnalysisConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { AIAnalysisResult, ThreadStructure, Reply, AIAnalysis } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const analysisConfig = getAnalysisConfig();
    const {
      tweetId,
      content,
      threadStructure,
      debug = false,
      targetLang = analysisConfig.default_language,
    } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Tweet content is required" },
        { status: 400 }
      );
    }

    // Analyze enhanced thread if threadStructure is provided AND has replies
    if (
      threadStructure &&
      (threadStructure.totalReplies > 0 || threadStructure.replies.length > 0)
    ) {
      return analyzeThread(
        tweetId,
        content,
        threadStructure,
        debug,
        targetLang
      );
    }

    // Analyze single tweet
    return analyzeSingleTweet(tweetId, content, debug, targetLang);
  } catch (error) {
    console.error("Error analyzing tweet:", error);
    return NextResponse.json(
      { error: "Failed to analyze tweet" },
      { status: 500 }
    );
  }
}

async function analyzeSingleTweet(
  tweetId: string,
  content: string,
  debug: boolean = false,
  targetLang: string = getAnalysisConfig().default_language
) {
  try {
    reloadPromptsConfig();

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
    let analysis: AIAnalysis | null = null;

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

      // Step 3: Analyze with SUMMARIZER prompt
      const summarizerPrompt = SYSTEM_PROMPTS.SUMMARIZER(targetLang);
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: summarizerPrompt },
          { role: "user", content: content },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      });

      try {
        let aiContent = analysisResponse.choices[0].message.content || "{}";
        if (aiContent.includes("```json")) {
          aiContent = aiContent.replace(/```json\s*/, "").replace(/\s*```/, "");
        }
        analysis = JSON.parse(aiContent);
      } catch (parseError) {
        console.error("Failed to parse AI analysis JSON:", parseError);
        console.error(
          "Raw content:",
          analysisResponse.choices[0].message.content
        );

        // Fallback analysis
        analysis = {
          type: "single",
          simple: {
            title: "Unable to analyze content",
            summary: "There was an error processing this tweet",
            why_matters: "Analysis failed due to parsing error",
          },
          expert: {
            summary: "Analysis parsing failed",
            impact_level: "low",
            project_impact: {
              relevance_score: 1,
              description: "Unable to determine impact due to analysis error",
              opportunities: "None identified",
              threats: "None identified",
            },
          },
        };
      }
    }

    if (!debug) {
      try {
        // Ensure terms is string if it exists
        if (
          analysis?.simple.terms &&
          typeof analysis.simple.terms === "object"
        ) {
          analysis.simple.terms = JSON.stringify(analysis.simple.terms);
        }

        const updatedTweet = await prisma.tweet.update({
          where: { tweetId },
          data: {
            isRelevant: relevanceResult.is_relevant,
            relevanceScore: relevanceResult.relevance_score,
            categories: JSON.stringify(relevanceResult.categories),
            translation: translation,
            summary: analysis?.simple.title || "",
            aiComments: analysis ? JSON.stringify(analysis) : "",
            isProcessed: true,
          },
        });

        return NextResponse.json({
          success: true,
          tweet: updatedTweet,
          analysis: {
            relevance: relevanceResult,
            translation,
            summary: analysis,
          },
        });
      } catch (saveError) {
        console.error("Failed to save analysis to database:", saveError);
        console.error("Analysis data:", analysis);
        return NextResponse.json(
          {
            error: "Failed to save analysis to database",
            details:
              saveError instanceof Error ? saveError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({
        success: true,
        debug: true,
        analysis: {
          relevance: relevanceResult,
          translation,
          summary: analysis,
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing single tweet:", error);
    return NextResponse.json(
      { error: "Failed to analyze single tweet" },
      { status: 500 }
    );
  }
}

async function analyzeThread(
  tweetId: string,
  mainTweet: string,
  threadStructure: ThreadStructure,
  debug: boolean = false,
  targetLang: string = getAnalysisConfig().default_language
) {
  try {
    reloadPromptsConfig();

    const { replies, replyTree, participants, maxDepth, totalReplies } =
      threadStructure;

    // Create comprehensive thread context for AI analysis
    let effectiveReplyTree: Reply[] = [];
    if (Array.isArray(replyTree) && replyTree.length > 0) {
      effectiveReplyTree = replyTree;
    } else if (Array.isArray(replies) && replies.length > 0) {
      effectiveReplyTree = replies;
    } else {
      effectiveReplyTree = [];
    }

    const threadContext = createThreadContext(
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

    // 3. Analyze thread with THREAD_ANALYZER prompt
    const threadAnalyzerPrompt = SYSTEM_PROMPTS.THREAD_ANALYZER(targetLang);
    const threadAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: threadAnalyzerPrompt },
        { role: "user", content: threadContext },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    let threadAnalysis: AIAnalysis;
    try {
      let content = threadAnalysisResponse.choices[0].message.content || "{}";
      if (content.includes("```json")) {
        content = content.replace(/```json\s*/, "").replace(/\s*```/, "");
      }
      threadAnalysis = JSON.parse(content);

      // Ensure thread_data has correct metrics
      if (threadAnalysis.thread_data) {
        threadAnalysis.thread_data.total_replies = totalReplies;
        threadAnalysis.thread_data.max_depth = maxDepth;
      }
    } catch (parseError) {
      console.error("Failed to parse thread analysis JSON:", parseError);
      console.error(
        "Raw content:",
        threadAnalysisResponse.choices[0].message.content
      );

      // Fallback thread analysis
      threadAnalysis = {
        type: "thread",
        simple: {
          title: "Thread discussion analysis",
          summary: "Thread analysis failed due to parsing error",
          viewpoints: "Unable to analyze viewpoints",
          why_matters: "Analysis failed",
        },
        expert: {
          summary: "Thread analysis parsing failed",
          impact_level: "low",
          project_impact: {
            relevance_score: 1,
            description: "Unable to determine thread impact",
            opportunities: "None identified",
            threats: "None identified",
          },
        },
        thread_data: {
          total_replies: totalReplies,
          max_depth: maxDepth,
          sentiment: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
          key_reactions: [],
          community_pulse: "Unable to analyze",
          controversial_points: [],
          consensus_areas: [],
          disagreement_areas: [],
        },
      };
    }

    if (!debug) {
      const updatedTweet = await prisma.tweet.update({
        where: { tweetId },
        data: {
          isRelevant: true,
          relevanceScore: relevanceResult.relevance_score,
          categories: JSON.stringify(relevanceResult.categories),
          translation: translation,
          summary: threadAnalysis.simple.title,
          aiComments: JSON.stringify(threadAnalysis),
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
          summary: threadAnalysis,
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
          summary: threadAnalysis,
          threadAnalysis,
          threadStructure,
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing thread:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      { error: "Failed to analyze thread" },
      { status: 500 }
    );
  }
}

function createThreadContext(
  mainTweet: string,
  replies: Reply[],
  participants: {
    username: string;
    name: string;
    replyCount: number;
    totalLikes: number;
  }[],
  maxDepth: number
): string {
  let context = `MAIN TWEET:\n${mainTweet}\n\n`;

  context += `THREAD STATISTICS:\n`;
  context += `- Total replies: ${replies.length}\n`;
  context += `- Max depth: ${maxDepth}\n`;
  context += `- Participants: ${participants.length}\n\n`;

  if (replies.length > 0) {
    context += `REPLIES:\n`;
    replies.slice(0, 20).forEach((reply, index) => {
      const depth = "  ".repeat(reply.depth || 0);
      context += `${depth}${index + 1}. @${reply.authorUsername}: ${
        reply.content
      }\n`;
    });

    if (replies.length > 20) {
      context += `... and ${replies.length - 20} more replies\n`;
    }
  }

  return context;
}
