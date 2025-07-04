# API Reference

Complete API documentation for X Parser endpoints with session-based parsing and manual AI analysis.

## Base URL

```
http://localhost:3000/api
```

## Authentication

- Most endpoints don't require authentication
- Session-based parsing requires Twitter auth cookies (`auth_token` and `ct0`)
- AI analysis is manual and on-demand

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
      "repliesData": "{\"replies\": [...], \"threadStructure\": {...}}",
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

## AI Analysis API (Manual)

### Analyze Tweet

```http
POST /api/ai/analyze
```

**Body:**

```json
{
  "tweetId": "1234567890",
  "content": "Tweet content to analyze",
  "threadStructure": {
    "totalReplies": 25,
    "maxDepth": 3,
    "participants": 15,
    "replies": [
      {
        "id": "reply_id",
        "authorUsername": "user1",
        "content": "Reply content...",
        "likes": 25,
        "replies": [...]
      }
    ],
    "replyTree": {
      "reply_id": {
        "content": "Reply content...",
        "author": "user1",
        "children": ["nested_reply_id"]
      }
    }
  },
  "targetLang": "en"
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
      "project_impact": {
        "relevance_to_project": "High relevance...",
        "opportunities": "Could improve...",
        "threats": "Potential risks..."
      }
    },
    "thread_analysis": {
      "total_replies": 25,
      "sentiment_breakdown": {
        "positive": 15,
        "negative": 3,
        "neutral": 7
      },
      "community_pulse": "positive",
      "key_topics": ["staking", "rewards", "decentralization"],
      "engagement_level": "high",
      "top_participants": [
        {
          "username": "user1",
          "reply_count": 3,
          "engagement_score": 85
        }
      ]
    }
  }
}
```

## Parser API

### Parse Tweet with Session

```http
POST /api/parser/twitter-session
```

**Body:**

```json
{
  "url": "https://x.com/vitalik/status/1234567890",
  "authToken": "session_auth_token",
  "csrfToken": "csrf_token_ct0",
  "includeReplies": true,
  "maxDepth": 3,
  "maxRepliesPerLevel": 50
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
    "repliesData": "{\"replies\": [...], \"threadStructure\": {...}}"
  },
  "threadStructure": {
    "totalReplies": 89,
    "maxDepth": 3,
    "participants": 45,
    "replies": [
      {
        "id": "reply_id",
        "authorUsername": "user1",
        "authorName": "User One",
        "content": "Great point about staking!",
        "likes": 25,
        "retweets": 5,
        "replies": 2,
        "createdAt": "2024-01-01T01:00:00Z",
        "replies": [...]
      }
    ],
    "replyTree": {
      "reply_id": {
        "content": "Great point about staking!",
        "author": "user1",
        "likes": 25,
        "children": ["nested_reply_id"],
        "depth": 1
      }
    }
  },
  "threadAnalysis": {
    "totalReplies": 89,
    "maxDepth": 3,
    "uniqueParticipants": 45,
    "engagementScore": 0.78
  }
}
```

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
      /* Tweet objects */
    }
  ],
  "count": 50,
  "hasMore": true,
  "cursor": "next_page_cursor"
}
```

## Auto-Monitoring API

### Monitor Timeline

Automatically monitors Twitter timeline for new tweets with intelligent filtering.

```http
POST /api/auto-monitor
```

**Body:**

```json
{
  "authToken": "session_auth_token",
  "csrfToken": "csrf_token_ct0"
}
```

**Response:**

```json
{
  "success": true,
  "processed": 25,
  "added": 8,
  "filtered": 17,
  "status": "Monitoring completed successfully",
  "next_run": "2024-01-01T01:30:00Z"
}
```

### Get Monitoring Status

```http
GET /api/auto-monitor/control
```

**Response:**

```json
{
  "isRunning": true,
  "lastRun": "2024-01-01T01:00:00Z",
  "lastStatus": "success: Added 8 new tweets",
  "nextRun": "2024-01-01T01:30:00Z",
  "stats": {
    "totalRuns": 45,
    "totalProcessed": 1250,
    "totalAdded": 380,
    "lastError": null
  }
}
```

### Control Monitoring

```http
POST /api/auto-monitor/control
```

**Body:**

```json
{
  "action": "start|stop|manual_run|credentials|clear_credentials",
  "authToken": "session_auth_token", // for credentials action
  "csrfToken": "csrf_token_ct0" // for credentials action
}
```

**Response:**

```json
{
  "success": true,
  "message": "Monitoring started successfully",
  "status": {
    "isRunning": true,
    "intervalMinutes": 30
  }
}
```

**Available Actions:**

- `start` - Start automatic monitoring
- `stop` - Stop automatic monitoring
- `manual_run` - Run monitoring once immediately
- `credentials` - Set/update Twitter session credentials
- `clear_credentials` - Clear stored credentials

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "error": "Error description",
  "needsLogin": true,
  "suggestion": "Please check your Twitter session credentials"
}
```

## Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (session expired)
- `403` - Forbidden (rate limited or access denied)
- `404` - Not Found (tweet not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limits

- Twitter API: ~150 requests per 15 minutes per endpoint
- OpenAI API: Depends on your plan
- Session-based parsing: Subject to Twitter's rate limits

## Data Models

### Tweet Object

```typescript
interface Tweet {
  id: string;
  tweetId: string;
  authorUsername: string;
  authorName: string;
  content: string;
  createdAt: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  isRelevant?: boolean;
  relevanceScore?: number;
  categories?: string; // JSON array
  translation?: string;
  summary?: string;
  aiComments?: string; // JSON object
  repliesData?: string; // JSON object with replies and threadStructure
  isFavorite: boolean;
  isProcessed: boolean;
  savedAt: string;
}
```

### Thread Structure

```typescript
interface ThreadStructure {
  totalReplies: number;
  maxDepth: number;
  participants: number;
  replies: Reply[];
  replyTree: Record<string, ReplyNode>;
}

interface Reply {
  id: string;
  authorUsername: string;
  authorName: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  createdAt: string;
  replies?: Reply[]; // Nested replies
}

interface ReplyNode {
  content: string;
  author: string;
  likes: number;
  children: string[];
  depth: number;
}
```

### AI Analysis Result

```typescript
interface AnalysisResult {
  relevance: {
    relevance_score: number;
    is_relevant: boolean;
    categories: string[];
    reason: string;
  };
  translation: string;
  summary: {
    summary: string;
    expert_comment: string;
    impact_level: string;
    project_impact: {
      relevance_to_project: string;
      opportunities: string;
      threats: string;
    };
  };
  thread_analysis: {
    total_replies: number;
    sentiment_breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    community_pulse: string;
    key_topics: string[];
    engagement_level: string;
    top_participants: Array<{
      username: string;
      reply_count: number;
      engagement_score: number;
    }>;
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

### Start Auto-Monitoring

```bash
curl -X POST "http://localhost:3000/api/auto-monitor/control" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "credentials",
    "authToken": "your_session_token",
    "csrfToken": "your_csrf_token"
  }'

curl -X POST "http://localhost:3000/api/auto-monitor/control" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start"
  }'
```

### Check Monitoring Status

```bash
curl "http://localhost:3000/api/auto-monitor/control"
```

### Manual Monitoring Run

```bash
curl -X POST "http://localhost:3000/api/auto-monitor/control" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manual_run"
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
