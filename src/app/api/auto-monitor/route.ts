import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAutoMonitoringConfig, getOpenAIConfig } from "@/lib/config";
import { openai, SYSTEM_PROMPTS } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const config = getAutoMonitoringConfig();

    if (!config.enabled) {
      return NextResponse.json(
        { error: "Auto-monitoring is disabled" },
        { status: 400 }
      );
    }

    const { auth_token, ct0 } = await request.json();

    if (!auth_token || !ct0) {
      return NextResponse.json(
        { error: "Twitter session credentials required" },
        { status: 400 }
      );
    }

    console.log("Starting auto-monitoring check...");

    // Get the last processed tweet ID to avoid duplicates
    const lastTweet = await prisma.tweet.findFirst({
      orderBy: { createdAt: "desc" },
      select: { tweetId: true },
    });

    const sinceId = lastTweet?.tweetId;

    // Fetch timeline tweets using internal Twitter API
    const timelineUrl = new URL(
      "https://twitter.com/i/api/2/timeline/home.json"
    );

    const params: Record<string, string> = {
      include_profile_interstitial_type: "1",
      include_blocking: "1",
      include_blocked_by: "1",
      include_followed_by: "1",
      include_want_retweets: "1",
      include_mute_edge: "1",
      include_can_dm: "1",
      include_can_media_tag: "1",
      include_ext_has_nft_avatar: "1",
      include_ext_is_blue_verified: "1",
      include_ext_verified_type: "1",
      include_ext_profile_image_shape: "1",
      skip_status: "1",
      cards_platform: "Web-12",
      include_cards: "1",
      include_ext_alt_text: "true",
      include_ext_limited_action_results: "true",
      include_quote_count: "true",
      include_reply_count: "1",
      tweet_mode: "extended",
      include_ext_collab_control: "true",
      include_ext_views: "true",
      include_entities: "true",
      include_user_entities: "true",
      include_ext_media_color: "true",
      include_ext_media_availability: "true",
      include_ext_sensitive_media_warning: "true",
      include_ext_trusted_friends_metadata: "true",
      send_error_codes: "true",
      simple_quoted_tweet: "true",
      count: Math.min(config.max_tweets_per_check, 200).toString(),
      ext: "mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,superFollowMetadata,unmentionInfo,editControl,collab_control,vibe",
    };

    // Add cursor if we have a since_id
    if (sinceId) {
      params.since_id = sinceId;
    }

    // Add all params to URL
    Object.keys(params).forEach((key) => {
      timelineUrl.searchParams.set(key, params[key]);
    });

    console.log("Making request to Twitter API:", timelineUrl.toString());
    console.log("Request headers:", {
      Cookie: `auth_token=${
        auth_token ? auth_token.substring(0, 10) + "..." : "missing"
      }; ct0=${ct0 ? ct0.substring(0, 10) + "..." : "missing"}`,
      "x-csrf-token": ct0 ? ct0.substring(0, 10) + "..." : "missing",
    });

    const response = await fetch(timelineUrl.toString(), {
      headers: {
        Authorization: `Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`,
        Cookie: `auth_token=${auth_token}; ct0=${ct0}`,
        "x-csrf-token": ct0,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Twitter-Active-User": "yes",
        "X-Twitter-Auth-Type": "OAuth2Session",
        "X-Twitter-Client-Language": "en",
        Referer: "https://twitter.com/home",
        Origin: "https://twitter.com",
      },
    });

    if (!response.ok) {
      console.error("Twitter API error:", response.status, response.statusText);
      const errorBody = await response.text();
      console.error("Error response body:", errorBody);

      return NextResponse.json(
        {
          error: `Twitter API error: ${response.status} - ${response.statusText}`,
          details: errorBody,
        },
        { status: response.status }
      );
    }

    // Parse Twitter API response
    interface TwitterApiResponse {
      globalObjects?: {
        tweets?: Record<
          string,
          {
            id_str: string;
            full_text?: string;
            text?: string;
            created_at: string;
            user_id_str: string;
            favorite_count?: number;
            retweet_count?: number;
            reply_count?: number;
            retweeted_status?: unknown;
            in_reply_to_status_id_str?: string;
          }
        >;
        users?: Record<
          string,
          {
            screen_name: string;
            name: string;
          }
        >;
      };
      timeline?: {
        instructions?: Array<{
          addEntries?: {
            entries?: Array<{
              entryId?: string;
              content?: {
                item?: {
                  content?: {
                    tweet?: {
                      id: string;
                    };
                  };
                };
              };
            }>;
          };
        }>;
      };
    }

    const timelineData: TwitterApiResponse = await response.json();

    console.log(
      "Raw Twitter API response:",
      JSON.stringify(timelineData, null, 2)
    );

    // Extract tweets from REST API response
    interface ProcessedTweet {
      id: string;
      text: string;
      created_at: string;
      author: {
        username: string;
        name: string;
      };
      metrics: {
        like_count: number;
        retweet_count: number;
        reply_count: number;
      };
      is_retweet: boolean;
      is_reply: boolean;
    }

    const tweets: ProcessedTweet[] = [];
    try {
      // REST API returns tweets directly in globalObjects.tweets
      const globalObjects = timelineData?.globalObjects;
      const timelineTweets = globalObjects?.tweets || {};
      const users = globalObjects?.users || {};

      // Get timeline entries
      const timeline =
        timelineData?.timeline?.instructions?.[0]?.addEntries?.entries || [];

      for (const entry of timeline) {
        if (
          entry.entryId?.startsWith("tweet-") &&
          entry.content?.item?.content?.tweet
        ) {
          const tweetId = entry.content.item.content.tweet.id;
          const tweet = timelineTweets[tweetId];
          const user = users[tweet?.user_id_str];

          if (tweet && user) {
            tweets.push({
              id: tweet.id_str,
              text: tweet.full_text || tweet.text || "",
              created_at: tweet.created_at,
              author: {
                username: user.screen_name,
                name: user.name,
              },
              metrics: {
                like_count: tweet.favorite_count || 0,
                retweet_count: tweet.retweet_count || 0,
                reply_count: tweet.reply_count || 0,
              },
              is_retweet: !!tweet.retweeted_status,
              is_reply: !!tweet.in_reply_to_status_id_str,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error parsing Twitter response:", error);
      return NextResponse.json(
        { error: "Failed to parse Twitter response" },
        { status: 500 }
      );
    }

    if (tweets.length === 0) {
      console.log("No new tweets found");
      return NextResponse.json({
        success: true,
        message: "No new tweets found",
        processed: 0,
      });
    }

    console.log(`Found ${tweets.length} new tweets`);

    let processedCount = 0;
    let addedCount = 0;

    for (const tweet of tweets) {
      try {
        // Skip retweets if configured
        if (config.skip_retweets && tweet.is_retweet) {
          console.log(`Skipping retweet: ${tweet.id}`);
          continue;
        }

        // Skip replies if configured
        if (config.skip_replies && tweet.is_reply) {
          console.log(`Skipping reply: ${tweet.id}`);
          continue;
        }

        // Check relevance if auto_add_relevant_only is enabled
        let isRelevant = true;
        let relevanceScore = 1.0;
        let categories: string[] = [];

        if (config.auto_add_relevant_only) {
          try {
            const relevanceResponse = await openai.chat.completions.create({
              model: getOpenAIConfig().model,
              messages: [
                { role: "system", content: SYSTEM_PROMPTS.RELEVANCE_CHECKER },
                { role: "user", content: tweet.text },
              ],
              temperature: getOpenAIConfig().temperatures.relevance,
            });

            const relevanceResult = JSON.parse(
              relevanceResponse.choices[0].message.content || "{}"
            );

            isRelevant =
              relevanceResult.is_relevant &&
              relevanceResult.relevance_score >= config.min_relevance_score;
            relevanceScore = relevanceResult.relevance_score || 0;
            categories = relevanceResult.categories || [];

            if (!isRelevant) {
              console.log(
                `Skipping irrelevant tweet: ${tweet.id} (score: ${relevanceScore})`
              );
              continue;
            }
          } catch (error) {
            console.error("Error checking relevance:", error);
            // Continue with default values if relevance check fails
          }
        }

        // Check if tweet already exists
        const existingTweet = await prisma.tweet.findUnique({
          where: { tweetId: tweet.id },
        });

        if (existingTweet) {
          console.log(`Tweet already exists: ${tweet.id}`);
          continue;
        }

        // No auto-analysis - tweets will be analyzed manually via /batch-analyze

        // Add tweet to database
        await prisma.tweet.create({
          data: {
            tweetId: tweet.id,
            authorUsername: tweet.author.username,
            authorName: tweet.author.name,
            content: tweet.text,
            createdAt: new Date(tweet.created_at),
            url: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
            likes: tweet.metrics.like_count,
            retweets: tweet.metrics.retweet_count,
            replies: tweet.metrics.reply_count,
            isRelevant: isRelevant,
            relevanceScore: relevanceScore,
            categories: JSON.stringify(categories),
            savedAt: new Date(),
            isFavorite: false,
            isProcessed: false, // Will be analyzed manually via /batch-analyze
          },
        });

        console.log(
          `Added new tweet: ${tweet.id} by @${tweet.author.username}`
        );
        addedCount++;
      } catch (error) {
        console.error(`Error processing tweet ${tweet.id}:`, error);
      }

      processedCount++;
    }

    console.log(
      `Auto-monitoring completed: processed ${processedCount}, added ${addedCount} tweets`
    );

    return NextResponse.json({
      success: true,
      message: `Auto-monitoring completed`,
      processed: processedCount,
      added: addedCount,
      total_found: tweets.length,
    });
  } catch (error) {
    console.error("Auto-monitoring error:", error);
    return NextResponse.json(
      { error: "Auto-monitoring failed" },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint
export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger auto-monitoring",
    config: getAutoMonitoringConfig(),
  });
}
