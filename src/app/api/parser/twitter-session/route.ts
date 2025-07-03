import { NextRequest, NextResponse } from "next/server";
import { Reply, ThreadStructure, Tweet } from "@/types";
import { prisma } from "@/lib/prisma";

// Twitter's public Bearer token used in web client
// This is not a secret - it's visible in browser dev tools when using Twitter
const TWITTER_BEARER_TOKEN =
  "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

export async function POST(request: NextRequest) {
  try {
    const {
      url,
      authToken,
      csrfToken,
      includeReplies = false,
      maxDepth = 3,
      maxRepliesPerLevel = 50,
    } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract tweet ID from URL
    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return NextResponse.json(
        { error: "Invalid Twitter URL format" },
        { status: 400 }
      );
    }

    if (!authToken || !csrfToken) {
      return NextResponse.json(
        { error: "auth_token and ct0 cookies are required" },
        { status: 400 }
      );
    }

    try {
      // Use working GraphQL endpoint for session auth
      const graphqlUrl =
        "https://twitter.com/i/api/graphql/0hWvDhmW8YQ-S_ib3azIrw/TweetResultByRestId";

      const variables = {
        tweetId: tweetId,
        withCommunity: false,
        includePromotedContent: false,
        withVoice: false,
        withBirdwatchNotes: false,
      };

      const features = {
        rweb_lists_timeline_redesign_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: true,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled:
          false,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
          true,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        responsive_web_media_download_video_enabled: false,
        responsive_web_enhance_cards_enabled: false,
      };

      const params = new URLSearchParams({
        variables: JSON.stringify(variables),
        features: JSON.stringify(features),
      });

      const response = await fetch(`${graphqlUrl}?${params}`, {
        headers: {
          Authorization: TWITTER_BEARER_TOKEN,
          Cookie: `auth_token=${authToken}; ct0=${csrfToken}; kdt=0; rweb_optin=side_engagement`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Twitter-Active-User": "yes",
          "X-Twitter-Auth-Type": "OAuth2Session",
          "X-Twitter-Client-Language": "en",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: `https://twitter.com/wintermute_t/status/${tweetId}`,
          Origin: "https://twitter.com",
          "X-Csrf-Token": csrfToken,
          "x-twitter-auth-type": "OAuth2Session",
          "x-twitter-client-language": "en",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Twitter API error: ${response.status}`);
        console.error("Error response body:", errorText);

        let suggestion = "Check if cookies are valid and user is logged in";
        if (response.status === 403) {
          suggestion =
            "Twitter session expired or rate limited. Please re-login to Twitter and get new cookies.";
        } else if (response.status === 400) {
          suggestion =
            "Invalid request parameters. Check the tweet URL format.";
        }

        return NextResponse.json(
          {
            success: false,
            error: `Twitter API returned ${response.status}`,
            needsLogin: response.status === 401 || response.status === 403,
            suggestion,
            detail: errorText,
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Parse the GraphQL response
      const tweet = parseTwitterGraphQLResponse(data, tweetId);

      if (!tweet) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to parse tweet data from Twitter API",
            suggestion: "Tweet may be deleted, private, or suspended",
          },
          { status: 404 }
        );
      }

      // Fetch enhanced replies if requested
      let threadStructure: ThreadStructure | null = null;
      if (includeReplies) {
        threadStructure = await fetchEnhancedReplies(
          tweetId,
          authToken,
          csrfToken,
          maxDepth,
          maxRepliesPerLevel
        );
      }

      // Save tweet to database
      const savedTweet = await prisma.tweet.upsert({
        where: { tweetId: tweet.tweetId as string },
        update: {
          content: tweet.content as string,
          authorUsername: tweet.authorUsername as string,
          authorName: tweet.authorName as string,
          createdAt: new Date(tweet.createdAt as string),
          url: tweet.url as string,
          likes: tweet.likes as number,
          retweets: tweet.retweets as number,
          replies: tweet.replies as number,
          repliesData: threadStructure ? JSON.stringify(threadStructure) : null,
        },
        create: {
          tweetId: tweet.tweetId as string,
          content: tweet.content as string,
          authorUsername: tweet.authorUsername as string,
          authorName: tweet.authorName as string,
          createdAt: new Date(tweet.createdAt as string),
          url: tweet.url as string,
          likes: tweet.likes as number,
          retweets: tweet.retweets as number,
          replies: tweet.replies as number,
          repliesData: threadStructure ? JSON.stringify(threadStructure) : null,
        },
      });

      // Don't trigger AI analysis here - user will do it separately

      return NextResponse.json({
        success: true,
        tweet: savedTweet,
        threadStructure: threadStructure,
        method: "twitter_session_enhanced",
        source: "twitter_graphql_api",
        note: `Retrieved using authenticated session${
          includeReplies
            ? ` with ${
                threadStructure?.totalReplies || 0
              } replies (max depth: ${maxDepth})`
            : ""
        }`,
        threadAnalysis: threadStructure
          ? {
              totalReplies: threadStructure.totalReplies,
              maxDepth: threadStructure.maxDepth,
              participants: threadStructure.participants.length,
              hasNestedDiscussion: threadStructure.maxDepth > 1,
            }
          : null,
      });
    } catch (error) {
      console.error("Twitter session error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch tweet using session",
          alternatives: [
            "Check if cookies are valid",
            "User may need to re-login to Twitter",
            "Try manual import method",
          ],
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in session parser:", error);
    return NextResponse.json(
      { error: "Failed to process session request" },
      { status: 500 }
    );
  }
}

function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

// Enhanced function to fetch nested replies with hierarchical structure
async function fetchEnhancedReplies(
  tweetId: string,
  authToken: string,
  csrfToken: string,
  maxDepth: number = 3,
  maxRepliesPerLevel: number = 50
): Promise<ThreadStructure> {
  try {
    // Use conversation endpoint for better reply structure
    const graphqlUrl =
      "https://twitter.com/i/api/graphql/nBS-WpgA6ZG0CyNHD517JQ/TweetDetail";

    const variables = {
      focalTweetId: tweetId,
      with_rux_injections: false,
      includePromotedContent: false,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: true,
      withBirdwatchNotes: true,
      withVoice: true,
      withV2Timeline: true,
      // Add parameters to get more comments
      count: 100, // Request more comments
      include_reply_count: true,
      include_entities: true,
    };

    const features = {
      rweb_video_timestamps_enabled: true,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      freedom_of_speech_not_reach_fetch_enabled: true,
      responsive_web_enhance_cards_enabled: true,
      creator_subscriptions_quote_tweet_preview_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_awards_web_tipping_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      articles_preview_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
        true,
      rweb_lists_timeline_redesign_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
    };

    // Collect all replies with pagination
    const allReplies: Reply[] = [];
    let cursor: string | null = null;
    let attemptCount = 0;
    const maxAttempts = 10; // Increased pagination attempts limit

    while (attemptCount < maxAttempts) {
      const currentVariables: Record<string, unknown> = { ...variables };
      if (cursor) {
        (currentVariables as Record<string, unknown>).cursor = cursor;
      }

      const params = new URLSearchParams({
        variables: JSON.stringify(currentVariables),
        features: JSON.stringify(features),
      });

      const response = await fetch(`${graphqlUrl}?${params}`, {
        headers: {
          Authorization: TWITTER_BEARER_TOKEN,
          Cookie: `auth_token=${authToken}; ct0=${csrfToken}; kdt=0; rweb_optin=side_engagement`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Twitter-Active-User": "yes",
          "X-Twitter-Auth-Type": "OAuth2Session",
          "X-Twitter-Client-Language": "en",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: `https://twitter.com/apoorveth/status/${tweetId}`,
          Origin: "https://twitter.com",
          "X-Csrf-Token": csrfToken,
          "x-twitter-auth-type": "OAuth2Session",
          "x-twitter-client-language": "en",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch replies: ${response.status}`);
        const errorText = await response.text();
        console.error("Replies fetch error:", errorText);
        break;
      }

      const data = await response.json();

      // Parse replies from this page
      const pageReplies = parseRepliesFromPage(data, tweetId);
      allReplies.push(...pageReplies);

      // Check if we have more pages
      cursor = extractCursorFromResponse(data);

      if (!cursor) {
        break; // No more pages
      }

      attemptCount++;

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // If we got few comments, try alternative method
    if (allReplies.length < 20) {
      const alternativeReplies = await fetchAlternativeReplies(
        tweetId,
        authToken,
        csrfToken
      );
      if (alternativeReplies.length > allReplies.length) {
        return buildThreadStructureFromReplies(
          alternativeReplies,
          tweetId,
          maxDepth,
          maxRepliesPerLevel
        );
      }
    }

    // Build thread structure from all collected replies
    return buildThreadStructureFromReplies(
      allReplies,
      tweetId,
      maxDepth,
      maxRepliesPerLevel
    );
  } catch (error) {
    console.error("Error fetching enhanced replies:", error);
    return createEmptyThreadStructure();
  }
}

// Alternative method to fetch replies using different endpoint
async function fetchAlternativeReplies(
  tweetId: string,
  authToken: string,
  csrfToken: string
): Promise<Reply[]> {
  try {
    // Use alternative endpoint to get comments
    const alternativeUrl =
      "https://twitter.com/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/TweetDetail";

    const variables = {
      focalTweetId: tweetId,
      with_rux_injections: false,
      includePromotedContent: false,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: true,
      withBirdwatchNotes: true,
      withVoice: true,
      withV2Timeline: true,
      count: 200, // Request even more comments
      include_reply_count: true,
      include_entities: true,
      cursor: null,
    };

    const features = {
      rweb_video_timestamps_enabled: true,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      freedom_of_speech_not_reach_fetch_enabled: true,
      responsive_web_enhance_cards_enabled: true,
      creator_subscriptions_quote_tweet_preview_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_awards_web_tipping_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      articles_preview_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
        true,
      rweb_lists_timeline_redesign_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
    };

    const params = new URLSearchParams({
      variables: JSON.stringify(variables),
      features: JSON.stringify(features),
    });

    const response = await fetch(`${alternativeUrl}?${params}`, {
      headers: {
        Authorization: TWITTER_BEARER_TOKEN,
        Cookie: `auth_token=${authToken}; ct0=${csrfToken}; kdt=0; rweb_optin=side_engagement`,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Twitter-Active-User": "yes",
        "X-Twitter-Auth-Type": "OAuth2Session",
        "X-Twitter-Client-Language": "en",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: `https://twitter.com/apoorveth/status/${tweetId}`,
        Origin: "https://twitter.com",
        "X-Csrf-Token": csrfToken,
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
      },
    });

    if (!response.ok) {
      console.error(`Alternative method failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const replies = parseRepliesFromPage(data, tweetId);

    return replies;
  } catch (error) {
    console.error("Error in alternative reply fetching:", error);
    return [];
  }
}

// Enhanced parsing function for nested reply structure
function parseEnhancedRepliesFromResponse(
  data: Record<string, unknown>,
  originalTweetId: string,
  maxDepth: number,
  maxRepliesPerLevel: number
): ThreadStructure {
  const allReplies: Reply[] = [];
  const replyMap = new Map<string, Reply>();
  const participants = new Map<
    string,
    { username: string; name: string; replyCount: number; totalLikes: number }
  >();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions = (data?.data as any)
      ?.threaded_conversation_with_injections_v2?.instructions;

    if (!instructions) {
      return createEmptyThreadStructure();
    }

    // First pass: collect all replies
    for (const instruction of instructions) {
      if (instruction.type === "TimelineAddEntries") {
        for (const entry of instruction.entries || []) {
          if (
            entry.entryId?.startsWith("conversationthread-") ||
            entry.entryId?.startsWith("tweet-")
          ) {
            const items = entry.entryId?.startsWith("conversationthread-")
              ? entry.content?.items || []
              : [{ item: { itemContent: entry.content } }];

            for (const item of items) {
              const tweet = item.item?.itemContent?.tweet_results?.result;
              if (tweet && tweet.legacy) {
                const legacy = tweet.legacy;
                const user = tweet.core?.user_results?.result?.legacy;

                // Skip original tweet
                if (legacy.id_str === originalTweetId) {
                  continue;
                }

                // Skip retweets and quotes
                if (
                  legacy.retweeted_status_id_str ||
                  legacy.quoted_status_id_str
                ) {
                  continue;
                }

                // Only include replies to this conversation
                if (legacy.conversation_id_str !== originalTweetId) {
                  continue;
                }

                const username = user?.screen_name || "unknown";
                const name = user?.name || "unknown";
                const likes = legacy.favorite_count || 0;

                // Build reply object
                const reply: Reply = {
                  tweetId: legacy.id_str,
                  authorUsername: username,
                  authorName: name,
                  content: legacy.full_text || legacy.text || "",
                  createdAt: new Date(legacy.created_at).toISOString(),
                  likes: likes,
                  retweets: legacy.retweet_count || 0,
                  replies: legacy.reply_count || 0,
                  source: "twitter_session_enhanced",
                  parentId: legacy.in_reply_to_status_id_str || originalTweetId,
                  replyToUserId: legacy.in_reply_to_screen_name,
                  depth: 0, // Will be calculated later
                  children: [],
                  conversationId: originalTweetId,
                };

                allReplies.push(reply);
                replyMap.set(reply.tweetId, reply);

                // Track participants
                const participant = participants.get(username) || {
                  username,
                  name,
                  replyCount: 0,
                  totalLikes: 0,
                };
                participant.replyCount++;
                participant.totalLikes += likes;
                participants.set(username, participant);
              }
            }
          }
        }
      }
    }

    // Second pass: build hierarchical structure and calculate depths
    const rootReplies: Reply[] = [];
    let actualMaxDepth = 0;

    for (const reply of allReplies) {
      if (reply.parentId === originalTweetId) {
        // Direct reply to main tweet
        reply.depth = 1;
        actualMaxDepth = Math.max(actualMaxDepth, 1);
        rootReplies.push(reply);
      } else if (reply.parentId && replyMap.has(reply.parentId)) {
        // Reply to another reply
        const parent = replyMap.get(reply.parentId)!;
        reply.depth = parent.depth + 1;

        // Only include if within maxDepth
        if (reply.depth <= maxDepth) {
          actualMaxDepth = Math.max(actualMaxDepth, reply.depth);
          parent.children.push(reply);

          // Sort children by creation time
          parent.children.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      }
    }

    // Sort root replies by creation time
    rootReplies.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Limit replies per level
    const limitedRootReplies = rootReplies.slice(0, maxRepliesPerLevel);
    limitChildrenRecursively(limitedRootReplies, maxRepliesPerLevel);

    // Filter replies that are actually included in the tree
    const includedReplies = collectAllRepliesFromTree(limitedRootReplies);

    return {
      mainTweet: null as unknown as Tweet, // Will be set by caller
      totalReplies: includedReplies.length,
      maxDepth: actualMaxDepth,
      replies: includedReplies,
      replyTree: limitedRootReplies,
      participants: Array.from(participants.values()),
    };
  } catch (error) {
    console.error("Error parsing enhanced replies:", error);
    return createEmptyThreadStructure();
  }
}

// Helper function to limit children recursively
function limitChildrenRecursively(replies: Reply[], maxPerLevel: number): void {
  for (const reply of replies) {
    if (reply.children.length > maxPerLevel) {
      reply.children = reply.children.slice(0, maxPerLevel);
    }
    limitChildrenRecursively(reply.children, maxPerLevel);
  }
}

// Helper function to collect all replies from tree structure
function collectAllRepliesFromTree(rootReplies: Reply[]): Reply[] {
  const allReplies: Reply[] = [];

  function collectRecursively(replies: Reply[]) {
    for (const reply of replies) {
      allReplies.push(reply);
      collectRecursively(reply.children);
    }
  }

  collectRecursively(rootReplies);
  return allReplies;
}

// Helper function to create empty thread structure
function createEmptyThreadStructure(): ThreadStructure {
  return {
    mainTweet: null as unknown as Tweet,
    totalReplies: 0,
    maxDepth: 0,
    replies: [],
    replyTree: [],
    participants: [],
  };
}

// Keep existing functions for backward compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchSessionReplies(
  tweetId: string,
  authToken: string,
  csrfToken: string
): Promise<Record<string, unknown>[]> {
  const threadStructure = await fetchEnhancedReplies(
    tweetId,
    authToken,
    csrfToken,
    2,
    20
  );
  return threadStructure.replies.map((reply) => ({
    tweetId: reply.tweetId,
    authorUsername: reply.authorUsername,
    authorName: reply.authorName,
    content: reply.content,
    createdAt: reply.createdAt,
    likes: reply.likes,
    retweets: reply.retweets,
    replies: reply.replies,
    source: reply.source,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseRepliesFromResponse(
  data: Record<string, unknown>,
  originalTweetId: string
): Record<string, unknown>[] {
  const threadStructure = parseEnhancedRepliesFromResponse(
    data,
    originalTweetId,
    2,
    20
  );
  return threadStructure.replies.map((reply) => ({
    tweetId: reply.tweetId,
    authorUsername: reply.authorUsername,
    authorName: reply.authorName,
    content: reply.content,
    createdAt: reply.createdAt,
    likes: reply.likes,
    retweets: reply.retweets,
    replies: reply.replies,
    source: reply.source,
  }));
}

function parseTwitterGraphQLResponse(
  data: Record<string, unknown>,
  tweetId: string
): Record<string, unknown> | null {
  try {
    // Try TweetResultByRestId structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tweetResult = (data?.data as any)?.tweetResult?.result;
    if (tweetResult && tweetResult.legacy) {
      const legacy = tweetResult.legacy;
      const user = tweetResult.core?.user_results?.result?.legacy;

      return {
        tweetId: legacy.id_str || tweetId,
        authorUsername: user?.screen_name || "unknown",
        authorName: user?.name || "unknown",
        content: legacy.full_text || legacy.text || "",
        createdAt: new Date(legacy.created_at).toISOString(),
        url: `https://x.com/${
          user?.screen_name || "unknown"
        }/status/${tweetId}`,
        likes: legacy.favorite_count || 0,
        retweets: legacy.retweet_count || 0,
        replies: legacy.reply_count || 0,
        source: "twitter_session",
      };
    }

    // Alternative structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tweet = (data?.data as any)?.tweet;
    if (tweet && tweet.legacy) {
      const legacy = tweet.legacy;
      const user = tweet.core?.user_results?.result?.legacy;

      return {
        tweetId: legacy.id_str || tweetId,
        authorUsername: user?.screen_name || "unknown",
        authorName: user?.name || "unknown",
        content: legacy.full_text || legacy.text || "",
        createdAt: new Date(legacy.created_at).toISOString(),
        url: `https://x.com/${
          user?.screen_name || "unknown"
        }/status/${tweetId}`,
        likes: legacy.favorite_count || 0,
        retweets: legacy.retweet_count || 0,
        replies: legacy.reply_count || 0,
        source: "twitter_session",
      };
    }

    return null;
  } catch (error) {
    console.error("GraphQL parsing error:", error);
    return null;
  }
}

// Helper function to parse replies from a single page
function parseRepliesFromPage(
  data: Record<string, unknown>,
  originalTweetId: string
): Reply[] {
  const replies: Reply[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions = (data?.data as any)
      ?.threaded_conversation_with_injections_v2?.instructions;

    if (!instructions) {
      return replies;
    }

    for (const instruction of instructions) {
      if (instruction.type === "TimelineAddEntries") {
        for (const entry of instruction.entries || []) {
          if (
            entry.entryId?.startsWith("conversationthread-") ||
            entry.entryId?.startsWith("tweet-")
          ) {
            const items = entry.entryId?.startsWith("conversationthread-")
              ? entry.content?.items || []
              : [{ item: { itemContent: entry.content } }];

            for (const item of items) {
              const tweet = item.item?.itemContent?.tweet_results?.result;
              if (tweet && tweet.legacy) {
                const legacy = tweet.legacy;
                const user = tweet.core?.user_results?.result?.legacy;

                // Skip original tweet
                if (legacy.id_str === originalTweetId) {
                  continue;
                }

                // Skip retweets and quotes
                if (
                  legacy.retweeted_status_id_str ||
                  legacy.quoted_status_id_str
                ) {
                  continue;
                }

                // Only include replies to this conversation
                if (legacy.conversation_id_str !== originalTweetId) {
                  continue;
                }

                const username = user?.screen_name || "unknown";
                const name = user?.name || "unknown";
                const likes = legacy.favorite_count || 0;

                // Build reply object
                const reply: Reply = {
                  tweetId: legacy.id_str,
                  authorUsername: username,
                  authorName: name,
                  content: legacy.full_text || legacy.text || "",
                  createdAt: new Date(legacy.created_at).toISOString(),
                  likes: likes,
                  retweets: legacy.retweet_count || 0,
                  replies: legacy.reply_count || 0,
                  source: "twitter_session_enhanced",
                  parentId: legacy.in_reply_to_status_id_str || originalTweetId,
                  replyToUserId: legacy.in_reply_to_screen_name,
                  depth: 0, // Will be calculated later
                  children: [],
                  conversationId: originalTweetId,
                };

                replies.push(reply);
              }
            }
          }
        }
      }
    }

    return replies;
  } catch (error) {
    console.error("Error parsing replies from page:", error);
    return replies;
  }
}

// Helper function to extract cursor from response
function extractCursorFromResponse(
  data: Record<string, unknown>
): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions = (data?.data as any)
      ?.threaded_conversation_with_injections_v2?.instructions;

    if (!instructions) {
      return null;
    }

    for (const instruction of instructions) {
      if (instruction.type === "TimelineAddEntries") {
        const entries = instruction.entries || [];

        for (const entry of entries) {
          if (entry.entryId?.startsWith("cursor-bottom-")) {
            // Try different paths to extract cursor value
            const cursorValue =
              entry.content?.value ||
              entry.content?.cursor_value ||
              entry.content?.cursorValue ||
              entry.content?.cursor?.value ||
              entry.content?.cursor?.cursor_value ||
              entry.content?.cursor?.cursorValue ||
              // New path:
              entry.content?.itemContent?.value;

            if (cursorValue) {
              return cursorValue;
            }
          }

          // Also check other cursor types
          if (entry.entryId?.includes("cursor")) {
            const cursorValue =
              entry.content?.value ||
              entry.content?.cursor_value ||
              entry.content?.cursorValue ||
              entry.content?.cursor?.value ||
              entry.content?.cursor?.cursor_value ||
              entry.content?.cursor?.cursorValue;

            if (cursorValue) {
              return cursorValue;
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error extracting cursor:", error);
    return null;
  }
}

// Helper function to build thread structure from all collected replies
function buildThreadStructureFromReplies(
  allReplies: Reply[],
  originalTweetId: string,
  maxDepth: number,
  maxRepliesPerLevel: number
): ThreadStructure {
  const replyMap = new Map<string, Reply>();
  const participants = new Map<
    string,
    { username: string; name: string; replyCount: number; totalLikes: number }
  >();

  // Build reply map and track participants
  for (const reply of allReplies) {
    replyMap.set(reply.tweetId, reply);

    const participant = participants.get(reply.authorUsername) || {
      username: reply.authorUsername,
      name: reply.authorName,
      replyCount: 0,
      totalLikes: 0,
    };
    participant.replyCount++;
    participant.totalLikes += reply.likes;
    participants.set(reply.authorUsername, participant);
  }

  // Build hierarchical structure and calculate depths
  const rootReplies: Reply[] = [];
  let actualMaxDepth = 0;

  for (const reply of allReplies) {
    if (reply.parentId === originalTweetId) {
      // Direct reply to main tweet
      reply.depth = 1;
      actualMaxDepth = Math.max(actualMaxDepth, 1);
      rootReplies.push(reply);
    } else if (reply.parentId && replyMap.has(reply.parentId)) {
      // Reply to another reply
      const parent = replyMap.get(reply.parentId)!;
      reply.depth = parent.depth + 1;

      // Only include if within maxDepth
      if (reply.depth <= maxDepth) {
        actualMaxDepth = Math.max(actualMaxDepth, reply.depth);
        parent.children.push(reply);

        // Sort children by creation time
        parent.children.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    }
  }

  // Sort root replies by creation time
  rootReplies.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Limit replies per level
  const limitedRootReplies = rootReplies.slice(0, maxRepliesPerLevel);
  limitChildrenRecursively(limitedRootReplies, maxRepliesPerLevel);

  // Filter replies that are actually included in the tree
  const includedReplies = collectAllRepliesFromTree(limitedRootReplies);

  return {
    mainTweet: null as unknown as Tweet, // Will be set by caller
    totalReplies: includedReplies.length,
    maxDepth: actualMaxDepth,
    replies: includedReplies,
    replyTree: limitedRootReplies,
    participants: Array.from(participants.values()),
  };
}
