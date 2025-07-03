import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      url,
      authToken,
      csrfToken,
      includeReplies = false,
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
          Authorization:
            "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
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
        return NextResponse.json(
          {
            success: false,
            error: `Twitter API returned ${response.status}`,
            needsLogin: response.status === 401,
            suggestion: "Check if cookies are valid and user is logged in",
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

      // Fetch replies if requested
      let replies: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (includeReplies) {
        replies = await fetchSessionReplies(tweetId, authToken, csrfToken);
      }

      return NextResponse.json({
        success: true,
        tweet: tweet,
        replies: replies,
        method: "twitter_session",
        source: "twitter_graphql_api",
        note: `Retrieved using authenticated session${
          includeReplies ? " with replies" : ""
        }`,
        threadAnalysis: includeReplies
          ? {
              totalReplies: replies.length,
              hasThread: replies.length > 0,
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

async function fetchSessionReplies(
  tweetId: string,
  authToken: string,
  csrfToken: string
): Promise<Record<string, unknown>[]> {
  try {
    // Use same working endpoint as main tweet but for conversation
    const graphqlUrl =
      "https://twitter.com/i/api/graphql/nBS-WpgA6ZG0CyNHD517JQ/TweetDetail";

    const variables = {
      focalTweetId: tweetId,
      with_rux_injections: false,
      includePromotedContent: true,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: true,
      withBirdwatchNotes: true,
      withVoice: true,
      withV2Timeline: true,
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

    const response = await fetch(`${graphqlUrl}?${params}`, {
      headers: {
        Authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
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
      return [];
    }

    const data = await response.json();
    const parsedReplies = parseRepliesFromResponse(data, tweetId);
    return parsedReplies;
  } catch (error) {
    console.error("Error fetching replies:", error);
    return [];
  }
}

function parseRepliesFromResponse(
  data: Record<string, unknown>,
  originalTweetId: string
): Record<string, unknown>[] {
  const replies: Record<string, unknown>[] = [];

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
          // Handle conversation threads (replies)
          if (entry.entryId?.startsWith("conversationthread-")) {
            const items = entry.content?.items || [];

            for (const item of items) {
              const tweet = item.item?.itemContent?.tweet_results?.result;
              if (tweet && tweet.legacy) {
                const legacy = tweet.legacy;
                const user = tweet.core?.user_results?.result?.legacy;

                // Skip if this is the original tweet or not a reply to it
                if (
                  legacy.id_str === originalTweetId ||
                  legacy.conversation_id_str !== originalTweetId
                ) {
                  continue;
                }

                // Skip if this is a retweet or quote tweet
                if (
                  legacy.retweeted_status_id_str ||
                  legacy.quoted_status_id_str
                ) {
                  continue;
                }

                replies.push({
                  tweetId: legacy.id_str,
                  authorUsername: user?.screen_name || "unknown",
                  authorName: user?.name || "unknown",
                  content: legacy.full_text || legacy.text || "",
                  createdAt: new Date(legacy.created_at).toISOString(),
                  likes: legacy.favorite_count || 0,
                  retweets: legacy.retweet_count || 0,
                  replies: legacy.reply_count || 0,
                  source: "twitter_session_reply",
                });
              }
            }
          }

          // Also check for direct tweet entries (fallback)
          else if (
            entry.entryId?.startsWith("tweet-") &&
            !entry.entryId.includes(originalTweetId)
          ) {
            const tweet = entry.content?.itemContent?.tweet_results?.result;
            if (tweet && tweet.legacy) {
              const legacy = tweet.legacy;
              const user = tweet.core?.user_results?.result?.legacy;

              // Skip if this is a retweet or quote tweet
              if (
                legacy.retweeted_status_id_str ||
                legacy.quoted_status_id_str
              ) {
                continue;
              }

              replies.push({
                tweetId: legacy.id_str,
                authorUsername: user?.screen_name || "unknown",
                authorName: user?.name || "unknown",
                content: legacy.full_text || legacy.text || "",
                createdAt: new Date(legacy.created_at).toISOString(),
                likes: legacy.favorite_count || 0,
                retweets: legacy.retweet_count || 0,
                replies: legacy.reply_count || 0,
                source: "twitter_session_reply",
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing replies:", error);
  }

  return replies.slice(0, 20); // Limit to 20 replies
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
