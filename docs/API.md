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
GET /api/tweets?filter={filter}&sort={sort}&page={page}&limit={limit}
```

**Parameters:**

- `filter` (optional): `all`, `relevant`, `favorites`, `ethereum`, `defi`, `nft`, `blockchain`
- `sort` (optional): `newest`, `oldest`, `most_liked`, `most_retweeted`, `most_replies`, `saved_newest`, `saved_oldest` (default: `newest`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Sort Options:**

- `newest` - Sort by tweet publication date (newest first)
- `oldest` - Sort by tweet publication date (oldest first)
- `most_liked` - Sort by like count (highest first)
- `most_retweeted` - Sort by retweet count (highest first)
- `most_replies` - Sort by reply count (highest first)
- `saved_newest` - Sort by when tweet was added to database (recently added first)
- `saved_oldest` - Sort by when tweet was added to database (first added first)

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
      "aiComments": "{\"type\": \"single\", \"simple\": {\"title\": \"...\", \"summary\": \"...\", \"terms\": \"...\", \"why_matters\": \"...\"}, \"expert\": {\"summary\": \"...\", \"impact_level\": \"high\", \"project_impact\": {...}}}",
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
    /* Updated tweet object with new aiComments field */
  },
  "analysis": {
    "type": "thread",
    "simple": {
      "title": "Ethereum 2.0 Staking Mechanism Explained",
      "summary": "Vitalik explains the technical details of Ethereum staking rewards and validator economics",
      "viewpoints": "Community is discussing validator profitability and decentralization concerns",
      "why_matters": "This directly impacts Ethereum's transition to proof-of-stake and validator incentives"
    },
    "expert": {
      "summary": "Deep technical analysis of Ethereum staking economics with focus on validator sustainability and network security implications",
      "impact_level": "high",
      "project_impact": {
        "relevance_score": 9,
        "description": "High relevance for Ethereum-based projects",
        "opportunities": "Could leverage improved staking mechanisms for protocol security",
        "threats": "Potential changes in validator economics may affect network stability"
      }
    },
    "thread_data": {
      "total_replies": 25,
      "max_depth": 3,
      "sentiment": {
        "positive": 15,
        "negative": 3,
        "neutral": 7,
        "mixed": 0
      },
      "key_reactions": [
        "Positive validator feedback",
        "Questions about implementation"
      ],
      "community_pulse": "Community is optimistic about staking improvements but has concerns about complexity",
      "controversial_points": [
        "Validator minimum requirements",
        "Centralization risks"
      ],
      "consensus_areas": [
        "Need for better documentation",
        "Importance of security"
      ],
      "disagreement_areas": ["Timeline for implementation"]
    }
  }
}
```

### AI Analysis Structure

The AI analysis follows a unified structure (`AIAnalysis`) that varies slightly based on the analysis type:

#### Single Tweet Analysis (`type: "single"`)

```json
{
  "type": "single",
  "simple": {
    "title": "Brief descriptive title of the tweet",
    "summary": "Concise summary of the tweet content",
    "terms": "Explanation of complex terms mentioned (or 'No complex terms to explain')",
    "why_matters": "Why this tweet is relevant and important"
  },
  "expert": {
    "summary": "In-depth expert analysis of the tweet",
    "impact_level": "low|medium|high",
    "project_impact": {
      "relevance_score": 8,
      "description": "How this relates to the project",
      "opportunities": "Potential positive outcomes",
      "threats": "Potential risks or challenges"
    }
  }
}
```

#### Thread Analysis (`type: "thread"`)

```json
{
  "type": "thread",
  "simple": {
    "title": "Brief descriptive title of the thread",
    "summary": "Concise summary of the main tweet",
    "viewpoints": "Key perspectives and opinions in the thread",
    "why_matters": "Why this thread is relevant and important"
  },
  "expert": {
    "summary": "In-depth expert analysis of the main tweet",
    "impact_level": "low|medium|high",
    "project_impact": {
      "relevance_score": 9,
      "description": "How this relates to the project",
      "opportunities": "Potential positive outcomes",
      "threats": "Potential risks or challenges"
    }
  },
  "thread_data": {
    "total_replies": 45,
    "max_depth": 3,
    "sentiment": {
      "positive": 25,
      "negative": 8,
      "neutral": 12,
      "mixed": 0
    },
    "key_reactions": ["Array of key reaction summaries"],
    "community_pulse": "Overall community sentiment and reaction",
    "controversial_points": ["Array of controversial discussion points"],
    "consensus_areas": ["Array of areas where community agrees"],
    "disagreement_areas": ["Array of areas with disagreement"]
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

## Telegram Bot Integration

X Parser includes a Telegram bot that automatically sends formatted notifications for relevant tweets with AI analysis.

### Bot Features

- **Automatic Notifications**: Sends analyzed tweets to configured Telegram channels
- **Formatted Messages**: Clean, structured presentation of tweet analysis
- **Language Support**: Supports both English and Russian analysis display
- **Thread Analysis**: Includes community reactions and sentiment for thread discussions

### Message Format

The bot sends two types of messages based on the analysis:

#### Single Tweet Message

```
🔥 New relevant tweet!

👤 @vitalik (Vitalik Buterin)
📅 25.01.2024 13:00

📝 Original:
The future of Ethereum scalability lies in rollups...

🌐 Translation: (if Russian analysis)
The future of Ethereum scalability lies in rollups...

🧠 Author's Tweet Analysis:
📌 Main point: Vitalik explains Ethereum scaling solutions
📄 Summary: Technical discussion of rollup implementation
📚 Terms: Rollups - Layer 2 scaling solutions that...
❓ Why it matters: Critical for understanding Ethereum's future

🎯 Expert Tweet Analysis:
📊 Summary: Deep analysis of Ethereum's scaling roadmap...
⚡ Impact level: high
🎯 Relevance: 9/10
📈 Opportunities: New scaling opportunities for dApps
⚠️ Threats: Potential centralization concerns

🤖 Metadata:
• Relevance: 0.9/1.0
• Type: Tweet
• Categories: ethereum, scaling

🔗 Link: https://x.com/vitalik/status/1234567890
💾 Comments: 15 | 👍 1250 | 🔄 340
```

#### Thread Message (with Community Reactions)

```
🧵 Thread Reactions (45 replies):
🌡️ Community is optimistic about scaling improvements but has concerns about complexity
💭 Mood: 😊 Mostly positive (35/45)
⚡ Debates: Centralization risks of rollup operators
```

### Configuration

Configure the bot in your environment variables:

```env
# Telegram Bot Settings
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_LANGUAGE=ru
```

### Bot Commands

The bot currently operates in notification mode only. Future versions may include interactive commands for:

- `/status` - Check bot status
- `/recent` - Get recent analyzed tweets
- `/settings` - Configure notification preferences

## Examples

### Fetch Recent Ethereum Tweets

```bash
# Get most recent Ethereum tweets
curl "http://localhost:3000/api/tweets?filter=ethereum&sort=newest&limit=10"

# Get most liked Ethereum tweets
curl "http://localhost:3000/api/tweets?filter=ethereum&sort=most_liked&limit=10"

# Get oldest tweets (chronological order)
curl "http://localhost:3000/api/tweets?filter=all&sort=oldest&limit=10"
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
