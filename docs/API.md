# API Reference

Complete API documentation for X Parser endpoints.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints don't require authentication. Session-based parsing requires Twitter cookies.

## Tweets API

### Get Tweets

```http
GET /api/tweets?filter={filter}&page={page}&limit={limit}
```

**Parameters:**

- `filter` (optional): `all`, `relevant`, `favorites`, `ethereum`, `defi`, `nft`, `blockchain`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "tweets": [
    {
      "id": "uuid",
      "tweetId": "1234567890",
      "authorUsername": "vitalik",
      "authorName": "Vitalik Buterin",
      "content": "Tweet content...",
      "createdAt": "2024-01-01T00:00:00Z",
      "url": "https://x.com/vitalik/status/1234567890",
      "likes": 1250,
      "retweets": 340,
      "replies": 89,
      "isRelevant": true,
      "relevanceScore": 0.85,
      "categories": "[\"ethereum\", \"defi\"]",
      "translation": "Translated content...",
      "summary": "Brief summary...",
      "aiComments": "{\"expert_comment\": \"...\"}",
      "isFavorite": false,
      "isProcessed": true,
      "savedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### Create Tweet

```http
POST /api/tweets
```

**Body:**

```json
{
  "tweetId": "1234567890",
  "authorUsername": "vitalik",
  "authorName": "Vitalik Buterin",
  "content": "Tweet content...",
  "createdAt": "2024-01-01T00:00:00Z",
  "url": "https://x.com/vitalik/status/1234567890",
  "likes": 1250,
  "retweets": 340,
  "replies": 89,
  "repliesData": "[{\"content\": \"Reply...\"}]"
}
```

**Response:**

```json
{
  "success": true,
  "tweet": {
    /* Tweet object */
  }
}
```

### Delete Tweet

```http
DELETE /api/tweets/{id}
```

**Response:**

```json
{
  "success": true,
  "message": "Tweet deleted successfully"
}
```

## AI Analysis API

### Analyze Tweet

```http
POST /api/ai/analyze
```

**Body:**

```json
{
  "tweetId": "1234567890",
  "content": "Tweet content to analyze",
  "replies": [
    {
      "authorUsername": "user1",
      "content": "Reply content...",
      "likes": 25
    }
  ],
  "targetLang": "en",
  "debug": false
}
```

**Response:**

```json
{
  "success": true,
  "tweet": {
    /* Updated tweet object */
  },
  "analysis": {
    "relevance": {
      "relevance_score": 0.85,
      "is_relevant": true,
      "categories": ["ethereum", "defi"],
      "reason": "Discusses Ethereum staking mechanisms"
    },
    "translation": "Translated content...",
    "summary": {
      "summary": "Brief summary...",
      "expert_comment": "Expert analysis...",
      "impact_level": "high",
      "lido_impact": {
        "relevance_to_lido": "High relevance...",
        "opportunities": "Could improve...",
        "threats": "Potential risks..."
      }
    },
    "thread_analysis": {
      "total_replies": 15,
      "sentiment_breakdown": {
        "positive": 8,
        "negative": 2,
        "neutral": 5
      },
      "community_pulse": "positive",
      "key_topics": ["staking", "rewards"],
      "engagement_level": "high"
    }
  }
}
```

## Parser API

### Parse Home Timeline

```http
POST /api/parser/timeline
```

**Body:**

```json
{
  "authToken": "session_auth_token",
  "csrfToken": "csrf_token_ct0",
  "count": 50,
  "includeReplies": true
}
```

**Response:**

```json
{
  "success": true,
  "tweets": [
    {
      "tweetId": "1234567890",
      "authorUsername": "vitalik",
      "content": "Tweet content...",
      "likes": 125,
      "retweets": 34,
      "replies": 8,
      "createdAt": "2024-01-01T00:00:00Z",
      "url": "https://x.com/vitalik/status/1234567890",
      "source": "timeline_html_parsing"
    }
  ],
  "count": 45,
  "method": "timeline_html_parsing",
  "source": "x.com_home_page",
  "message": "Successfully fetched 45 tweets from home timeline"
}
```

### Parse with Session

```http
POST /api/parser/twitter-session
```

**Body:**

```json
{
  "url": "https://x.com/vitalik/status/1234567890",
  "authToken": "session_auth_token",
  "csrfToken": "csrf_token_ct0",
  "includeReplies": true
}
```

**Response:**

```json
{
  "success": true,
  "tweet": {
    "tweetId": "1234567890",
    "authorUsername": "vitalik",
    "authorName": "Vitalik Buterin",
    "content": "Tweet content...",
    "createdAt": "2024-01-01T00:00:00Z",
    "url": "https://x.com/vitalik/status/1234567890",
    "likes": 1250,
    "retweets": 340,
    "replies": 89,
    "source": "twitter_session"
  },
  "replies": [
    {
      "tweetId": "1234567891",
      "authorUsername": "user1",
      "authorName": "User One",
      "content": "Reply content...",
      "likes": 25,
      "retweets": 3,
      "replies": 1,
      "createdAt": "2024-01-01T00:01:00Z",
      "source": "twitter_session_reply"
    }
  ],
  "repliesCount": 12
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "message": "Detailed description",
  "suggestion": "How to fix this issue",
  "needsLogin": false
}
```

### Common Error Codes

- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid session)
- `403` - Forbidden (session expired)
- `404` - Not Found (tweet/user not found)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Session Errors

```json
{
  "success": false,
  "error": "Session expired or invalid",
  "needsLogin": true,
  "suggestion": "Please update your session cookies in Settings"
}
```

## Rate Limits

- **AI Analysis**: 60 requests/minute
- **Twitter Parsing**: 300 requests/15 minutes
- **General API**: 1000 requests/hour

Rate limits are configurable in `config/app.json`.

## Data Models

### Tweet Object

```typescript
interface Tweet {
  id: string; // UUID
  tweetId: string; // Twitter ID
  authorUsername: string; // @username
  authorName: string; // Display name
  content: string; // Tweet text
  createdAt: Date; // Tweet date
  url: string; // Tweet URL
  likes: number; // Like count
  retweets: number; // Retweet count
  replies: number; // Reply count

  // AI Analysis
  isRelevant: boolean; // AI relevance
  relevanceScore?: number; // 0-1 score
  categories?: string; // JSON array
  translation?: string; // Translated text
  summary?: string; // AI summary
  aiComments?: string; // JSON analysis
  repliesData?: string; // JSON replies

  // App metadata
  savedAt: Date; // Save timestamp
  isFavorite: boolean; // User favorite
  isProcessed: boolean; // AI processed
}
```

### Analysis Result

```typescript
interface AIAnalysisResult {
  relevance_score: number; // 0-1
  is_relevant: boolean; // True/false
  categories: string[]; // ["ethereum", "defi"]
  reason: string; // Explanation
}

interface AISummaryResult {
  summary: string; // Brief summary
  expert_comment: string; // Expert analysis
  impact_level: "low" | "medium" | "high";
  lido_impact?: {
    // Protocol analysis
    relevance_to_lido: string;
    opportunities: string;
    threats: string;
  };
  thread_analysis?: {
    total_replies: number;
    sentiment_breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    community_pulse: string;
    key_topics: string[];
    engagement_level: string;
  };
}
```

## Examples

### Fetch Recent Ethereum Tweets

```bash
curl "http://localhost:3000/api/tweets?filter=ethereum&limit=10"
```

### Analyze Tweet with Replies

```bash
curl -X POST "http://localhost:3000/api/ai/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "tweetId": "1234567890",
    "content": "Ethereum 2.0 staking rewards discussion...",
    "replies": [{"authorUsername": "user1", "content": "Great point!"}],
    "targetLang": "en"
  }'
```

### Parse Home Timeline

```bash
curl -X POST "http://localhost:3000/api/parser/timeline" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "your_session_token",
    "csrfToken": "your_csrf_token",
    "count": 20,
    "includeReplies": true
  }'
```

### Parse Tweet with Session

```bash
curl -X POST "http://localhost:3000/api/parser/twitter-session" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://x.com/vitalik/status/1234567890",
    "authToken": "your_session_token",
    "csrfToken": "your_csrf_token",
    "includeReplies": true
  }'
```

## Parsing Methods

The application supports these parsing methods:

1. **Twitter Session (Recommended)** - Uses your browser session cookies to access Twitter
2. **Timeline Parser** - Fetches tweets from your home timeline feed
3. **Manual Input** - Copy and paste tweet content manually
4. **Twitter API** - Official API (requires keys, not implemented)
