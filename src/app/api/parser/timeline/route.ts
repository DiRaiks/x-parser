/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { authToken, csrfToken, count = 20 } = await request.json();

    if (!authToken || !csrfToken) {
      return NextResponse.json(
        { error: "auth_token and ct0 cookies are required" },
        { status: 400 }
      );
    }

    try {
      // Use home page HTML parsing instead of GraphQL API since query IDs change frequently
      const homeUrl = "https://x.com/home";

      const response = await fetch(homeUrl, {
        method: "GET",
        headers: {
          Cookie: `auth_token=${authToken}; ct0=${csrfToken}; kdt=0; rweb_optin=side_engagement`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            {
              success: false,
              error: "Session expired or invalid",
              needsLogin: true,
              suggestion: "Please update your session cookies in Settings",
            },
            { status: response.status }
          );
        }

        return NextResponse.json(
          { error: `Home page returned ${response.status}` },
          { status: response.status }
        );
      }

      const html = await response.text();

      // Parse tweets from HTML using our existing logic
      const tweets = parseHomeTimelineHTML(html, count);

      if (tweets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No tweets found in timeline",
            suggestion:
              "Make sure you follow some accounts or timeline is not empty",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        tweets: tweets,
        count: tweets.length,
        method: "timeline_html_parsing",
        source: "x.com_home_page",
        message: `Successfully fetched ${tweets.length} tweets from home timeline`,
        note: "Using HTML parsing since GraphQL query IDs change frequently",
      });
    } catch (fetchError) {
      console.error("Timeline fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch timeline: " + (fetchError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}

function parseHomeTimelineHTML(
  html: string,
  maxTweets: number
): Record<string, unknown>[] {
  const tweets: Record<string, unknown>[] = [];

  try {
    // Method 1: Look for __INITIAL_STATE__ script containing timeline data
    const initialStateMatch = html.match(
      /window\.__INITIAL_STATE__\s*=\s*({.*?});/
    );

    if (initialStateMatch) {
      try {
        const initialState = JSON.parse(initialStateMatch[1]);

        // Look for timeline data in entities.tweets
        if (initialState?.entities?.tweets) {
          const tweetIds = Object.keys(initialState.entities.tweets);

          for (const tweetId of tweetIds.slice(0, maxTweets)) {
            const tweet = initialState.entities.tweets[tweetId];
            const user = initialState.entities.users?.[tweet.user_id_str];

            if (tweet && user) {
              tweets.push(formatTweetFromInitialState(tweet, user));
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing __INITIAL_STATE__:", parseError);
      }
    }

    // Method 2: Look for JSON-LD script tags with structured data
    if (tweets.length === 0) {
      const jsonLdMatches = html.match(
        /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/g
      );

      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const jsonContent = match
              .replace(/<script[^>]*>/, "")
              .replace(/<\/script>/, "");
            const data = JSON.parse(jsonContent);

            if (data["@type"] === "WebPage" && data.mainEntity) {
              // Extract tweet data from structured data
              const entities = Array.isArray(data.mainEntity)
                ? data.mainEntity
                : [data.mainEntity];
              for (const entity of entities.slice(0, maxTweets)) {
                if (entity["@type"] === "SocialMediaPosting") {
                  tweets.push(formatTweetFromJsonLd(entity));
                }
              }
            }
          } catch {
            // Skip invalid JSON-LD
          }
        }
      }
    }

    // Method 3: Extract from React component data
    if (tweets.length === 0) {
      const reactDataMatches = html.match(
        /{"__typename":"Tweet"[^}]*"legacy":\{[^}]*"full_text":"[^"]*"/g
      );

      if (reactDataMatches) {
        for (const match of reactDataMatches.slice(0, maxTweets)) {
          try {
            // Try to reconstruct valid JSON from partial matches
            const fullMatch = html.substring(
              html.indexOf(match),
              html.indexOf("}}", html.indexOf(match)) + 2
            );
            const tweetData = JSON.parse(fullMatch);
            tweets.push(formatTweetFromReactData(tweetData));
          } catch {
            // Skip invalid data
          }
        }
      }
    }

    // Method 4: Fallback to simple text extraction
    if (tweets.length === 0) {
      console.log("Using fallback text extraction");

      // Extract tweet text using data-testid attributes
      const tweetTextRegex = /data-testid="tweetText"[^>]*><[^>]*>([^<]+)/g;
      let match;
      let index = 0;

      while ((match = tweetTextRegex.exec(html)) && index < maxTweets) {
        const text = match[1].trim();
        if (text && text.length > 10) {
          // Filter out very short texts
          tweets.push({
            tweetId: `extracted_${Date.now()}_${index}`,
            authorUsername: "unknown",
            authorName: "Timeline User",
            content: text,
            createdAt: new Date().toISOString(),
            url: `https://x.com/home`,
            likes: 0,
            retweets: 0,
            replies: 0,
            source: "html_text_extraction",
            method: "timeline_html_parsing",
          });
          index++;
        }
      }
    }

    return tweets;
  } catch (parseError) {
    console.error("Error parsing home timeline HTML:", parseError);
    return tweets;
  }
}

function formatTweetFromInitialState(
  tweet: Record<string, unknown>,
  user: Record<string, unknown>
): Record<string, unknown> {
  return {
    tweetId: tweet.id_str,
    authorUsername: user.screen_name,
    authorName: user.name,
    content: tweet.full_text || tweet.text || "",
    createdAt: new Date(tweet.created_at as string).toISOString(),
    url: `https://x.com/${user.screen_name}/status/${tweet.id_str}`,
    likes: tweet.favorite_count || 0,
    retweets: tweet.retweet_count || 0,
    replies: tweet.reply_count || 0,
    source: "initial_state",
    method: "timeline_html_parsing",
  };
}

function formatTweetFromJsonLd(entity: any): any {
  return {
    tweetId: entity.identifier || `jsonld_${Date.now()}`,
    authorUsername: entity.author?.identifier || "unknown",
    authorName: entity.author?.name || "Unknown User",
    content: entity.text || entity.articleBody || "",
    createdAt: entity.datePublished || new Date().toISOString(),
    url: entity.url || "https://x.com/home",
    likes:
      entity.interactionStatistic?.find(
        (stat: any) => stat.interactionType === "LikeAction"
      )?.userInteractionCount || 0,
    retweets:
      entity.interactionStatistic?.find(
        (stat: any) => stat.interactionType === "ShareAction"
      )?.userInteractionCount || 0,
    replies:
      entity.interactionStatistic?.find(
        (stat: any) => stat.interactionType === "ReplyAction"
      )?.userInteractionCount || 0,
    source: "json_ld",
    method: "timeline_html_parsing",
  };
}

function formatTweetFromReactData(tweetData: any): any {
  const legacy = tweetData.legacy;
  const user = tweetData.core?.user_results?.result?.legacy;

  return {
    tweetId: legacy?.id_str || `react_${Date.now()}`,
    authorUsername: user?.screen_name || "unknown",
    authorName: user?.name || "Unknown User",
    content: legacy?.full_text || "",
    createdAt: legacy?.created_at
      ? new Date(legacy.created_at).toISOString()
      : new Date().toISOString(),
    url: user?.screen_name
      ? `https://x.com/${user.screen_name}/status/${legacy?.id_str}`
      : "https://x.com/home",
    likes: legacy?.favorite_count || 0,
    retweets: legacy?.retweet_count || 0,
    replies: legacy?.reply_count || 0,
    source: "react_component",
    method: "timeline_html_parsing",
  };
}
