# Configuration Guide

Complete configuration reference for X Parser with session-based parsing and manual AI analysis.

## Overview

X Parser uses JSON configuration files to customize AI behavior, parsing settings, session management, and application features. Configuration files are stored in the `config/` directory and are not tracked in git for privacy and customization.

## Configuration Files

### `config/app.json`

Main application settings including AI models, parsing limits, thread analysis, and session management.

### `config/prompts.json`

AI prompts for different analysis tasks - fully customizable for your specific use case.

## App Configuration (`config/app.json`)

### Complete Example

```json
{
  "openai": {
    "model": "gpt-4o-mini",
    "temperatures": {
      "relevance": 0.3,
      "translation": 0.1,
      "summary": 0.5,
      "thread_analysis": 0.4
    },
    "max_tokens": {
      "relevance": 500,
      "translation": 1000,
      "summary": 800,
      "thread_analysis": 1000
    },
    "timeout_ms": 60000
  },
  "parsing": {
    "max_tweets_per_fetch": 50,
    "fetch_interval_minutes": 5,
    "max_retries": 3,
    "request_timeout_ms": 30000,
    "rate_limit_delay_ms": 3000,
    "thread_parsing": {
      "max_depth": 3,
      "max_replies_per_level": 50,
      "pagination_timeout": 30000,
      "include_nested_replies": true
    }
  },
  "analysis": {
    "default_language": "en",
    "supported_languages": ["en", "ru"],
    "manual_analysis": true,
    "auto_analysis": false,
    "relevance_threshold": 0.6,
    "sentiment_analysis": true
  },
  "session": {
    "validation_interval_ms": 300000,
    "retry_on_auth_fail": true,
    "fallback_to_bearer": true,
    "session_timeout_hours": 24
  },
  "database": {
    "auto_cleanup_days": 30,
    "backup_interval_hours": 24,
    "thread_data_retention_days": 60
  },
  "ui": {
    "default_thread_collapsed": false,
    "show_debug_info": false,
    "auto_refresh_interval_ms": 30000
  }
}
```

### OpenAI Settings

Configure AI model behavior and performance:

```json
{
  "openai": {
    "model": "gpt-4o-mini",
    "temperatures": {
      "relevance": 0.3, // Lower = more consistent relevance detection
      "translation": 0.1, // Lower = more accurate translations
      "summary": 0.5, // Balanced = creative but focused summaries
      "thread_analysis": 0.4 // Balanced = analytical thread insights
    },
    "max_tokens": {
      "relevance": 500, // Detailed relevance analysis
      "translation": 1000, // Full translation with context
      "summary": 800, // Comprehensive summaries
      "thread_analysis": 1000 // Detailed thread analysis
    },
    "timeout_ms": 60000 // 60 second timeout for AI requests
  }
}
```

**Available Models:**

- `gpt-4o-mini` (recommended) - Fast, cost-effective, excellent for analysis
- `gpt-4o` - Most capable, best for complex analysis
- `gpt-4-turbo` - Balanced performance and speed
- `gpt-3.5-turbo` - Budget option, limited analysis depth

### Parsing Settings

Control Twitter parsing behavior and thread analysis:

```json
{
  "parsing": {
    "max_tweets_per_fetch": 50, // Max tweets per timeline fetch
    "fetch_interval_minutes": 5, // Automatic fetch interval
    "max_retries": 3, // Retry failed requests
    "request_timeout_ms": 30000, // Request timeout (30s)
    "rate_limit_delay_ms": 3000, // Delay between requests (3s)
    "thread_parsing": {
      "max_depth": 3, // Maximum reply depth to parse
      "max_replies_per_level": 50, // Max replies per depth level
      "pagination_timeout": 30000, // Timeout for pagination requests
      "include_nested_replies": true // Parse nested reply chains
    }
  }
}
```

**Thread Parsing Options:**

- `max_depth`: Controls how deep the reply chain goes (1-5)
- `max_replies_per_level`: Limits replies at each level (10-100)
- `pagination_timeout`: Prevents hanging on large threads
- `include_nested_replies`: Whether to parse reply-to-reply chains

### Analysis Settings

Configure AI analysis features and behavior:

```json
{
  "analysis": {
    "default_language": "en", // Default target language
    "supported_languages": ["en", "ru"], // Available languages
    "manual_analysis": true, // Manual analysis mode
    "auto_analysis": false, // Disable automatic analysis
    "relevance_threshold": 0.6, // Minimum relevance score
    "sentiment_analysis": true // Enable sentiment analysis
  }
}
```

**Manual vs Automatic Analysis:**

- `manual_analysis: true` - User clicks "Analyze" button (recommended)
- `auto_analysis: true` - Automatic analysis on tweet addition (expensive)

**Language Codes:**

- `en` - English
- `ru` - Russian
- Add more as needed in prompts

### Session Management

Configure Twitter session handling:

```json
{
  "session": {
    "validation_interval_ms": 300000, // Check session every 5 minutes
    "retry_on_auth_fail": true, // Retry with fresh session on failure
    "fallback_to_bearer": true, // Use Bearer token if session fails
    "session_timeout_hours": 24 // Assume session expires after 24h
  }
}
```

### Database Settings

Database management and retention:

```json
{
  "database": {
    "auto_cleanup_days": 30, // Auto-delete old tweets
    "backup_interval_hours": 24, // Database backup frequency
    "thread_data_retention_days": 60 // Keep thread data longer
  }
}
```

### UI Settings

User interface behavior:

```json
{
  "ui": {
    "default_thread_collapsed": false, // Show thread structure by default
    "show_debug_info": false, // Hide debug information
    "auto_refresh_interval_ms": 30000 // Auto-refresh tweets every 30s
  }
}
```

## Prompt Configuration (`config/prompts.json`)

### Complete Example

```json
{
  "relevance_checker": {
    "system": "You are an expert in blockchain, cryptocurrency, and DeFi protocols. Analyze tweets for relevance to Ethereum ecosystem, DeFi protocols, and staking. Focus on technical developments, market implications, and protocol updates.",
    "user": "Analyze this tweet for relevance to blockchain/crypto/DeFi:\n\nContent: {content}\nAuthor: {author}\nEngagement: {likes} likes, {retweets} retweets\n\nRespond with JSON:\n{\n  \"relevance_score\": 0.0-1.0,\n  \"is_relevant\": boolean,\n  \"categories\": [\"ethereum\", \"defi\", \"staking\", \"nft\", \"blockchain\"],\n  \"reason\": \"detailed explanation\"\n}"
  },
  "translator": {
    "system": "You are a professional translator specializing in cryptocurrency, blockchain, and financial terminology. Maintain technical accuracy while making content accessible.",
    "user": "Translate this tweet to {target_language}. Preserve technical terms, hashtags, and mentions. Maintain the original tone and context:\n\n{content}"
  },
  "summarizer": {
    "system": "You are a blockchain expert providing analysis for the crypto community. Focus on protocol implications, market opportunities, and strategic insights. Provide actionable intelligence.",
    "user": "Analyze this tweet and its discussion context:\n\nTweet: {content}\nAuthor: {author}\nThread Data: {thread_data}\n\nProvide comprehensive analysis in JSON format:\n{\n  \"summary\": \"concise summary\",\n  \"expert_comment\": \"detailed expert analysis\",\n  \"impact_level\": \"low/medium/high\",\n  \"project_impact\": {\n    \"relevance_to_project\": \"how this relates to your project\",\n    \"opportunities\": \"potential opportunities\",\n    \"threats\": \"potential risks or challenges\"\n  }\n}"
  },
  "thread_analyzer": {
    "system": "You are a social media analyst specializing in cryptocurrency communities. Analyze discussion threads for sentiment patterns, key insights, and community dynamics.",
    "user": "Analyze this Twitter thread discussion:\n\nOriginal Tweet: {content}\nThread Structure: {thread_structure}\nTotal Replies: {total_replies}\n\nProvide detailed analysis in JSON format:\n{\n  \"total_replies\": number,\n  \"sentiment_breakdown\": {\n    \"positive\": number,\n    \"negative\": number,\n    \"neutral\": number\n  },\n  \"community_pulse\": \"overall sentiment description\",\n  \"key_topics\": [\"topic1\", \"topic2\"],\n  \"engagement_level\": \"low/medium/high\",\n  \"top_participants\": [\n    {\n      \"username\": \"user\",\n      \"reply_count\": number,\n      \"engagement_score\": number\n    }\n  ]\n}"
  }
}
```

### Customizing Prompts

#### Relevance Checker

Controls how AI determines tweet relevance:

```json
{
  "relevance_checker": {
    "system": "Define your expertise area and focus...",
    "user": "Analysis request format with placeholders..."
  }
}
```

**Available Placeholders:**

- `{content}` - Tweet content
- `{author}` - Tweet author username
- `{likes}` - Like count
- `{retweets}` - Retweet count
- `{replies}` - Reply count

#### Translator

Controls translation style and accuracy:

```json
{
  "translator": {
    "system": "Define translation expertise and style...",
    "user": "Translation request with context preservation..."
  }
}
```

**Available Placeholders:**

- `{content}` - Content to translate
- `{target_language}` - Target language (en, ru, etc.)
- `{source_language}` - Detected source language

#### Summarizer

Controls tweet and thread summarization:

```json
{
  "summarizer": {
    "system": "Define analysis expertise and focus areas...",
    "user": "Analysis request with comprehensive context..."
  }
}
```

**Available Placeholders:**

- `{content}` - Tweet content
- `{author}` - Tweet author
- `{thread_data}` - Full thread structure JSON
- `{likes}` - Engagement metrics
- `{retweets}` - Engagement metrics

#### Thread Analyzer

Controls thread discussion analysis:

```json
{
  "thread_analyzer": {
    "system": "Define social media analysis expertise...",
    "user": "Thread analysis request with structure data..."
  }
}
```

**Available Placeholders:**

- `{content}` - Original tweet content
- `{thread_structure}` - Full thread structure
- `{total_replies}` - Total reply count
- `{participants}` - Number of unique participants

## Advanced Configuration

### Performance Tuning

For high-volume usage:

```json
{
  "openai": {
    "parallel_requests": 3,
    "request_batching": true,
    "cache_responses": true
  },
  "parsing": {
    "concurrent_threads": 2,
    "batch_size": 10,
    "memory_limit_mb": 512
  }
}
```

### Debug Settings

For troubleshooting:

```json
{
  "debug": {
    "enabled": true,
    "level": "verbose",
    "log_requests": true,
    "log_responses": false,
    "save_raw_data": true
  }
}
```

### Security Settings

For production deployment:

```json
{
  "security": {
    "rate_limiting": true,
    "request_validation": true,
    "sanitize_inputs": true,
    "max_request_size_mb": 10
  }
}
```

## Configuration Validation

The app validates configuration on startup:

- **JSON Syntax**: Valid JSON format
- **Required Fields**: All necessary fields present
- **Value Ranges**: Numeric values within acceptable ranges
- **Model Availability**: OpenAI model exists and accessible
- **Language Codes**: Supported language combinations

## Environment-Specific Configs

### Development

```json
{
  "debug": { "enabled": true },
  "openai": { "timeout_ms": 120000 },
  "ui": { "show_debug_info": true }
}
```

### Production

```json
{
  "debug": { "enabled": false },
  "openai": { "timeout_ms": 30000 },
  "security": { "rate_limiting": true }
}
```

## Migration and Updates

When updating the app:

1. **Backup** current config files
2. **Run** `yarn init-config` to get new defaults
3. **Merge** your custom settings
4. **Test** with sample tweets
5. **Deploy** updated configuration

## Common Configuration Patterns

### Cost Optimization

```json
{
  "openai": {
    "model": "gpt-4o-mini",
    "max_tokens": { "relevance": 200 }
  },
  "analysis": { "manual_analysis": true }
}
```

### High Accuracy

```json
{
  "openai": {
    "model": "gpt-4o",
    "temperatures": { "relevance": 0.1 }
  },
  "parsing": { "max_retries": 5 }
}
```

### Large Scale

```json
{
  "parsing": {
    "thread_parsing": {
      "max_depth": 5,
      "max_replies_per_level": 100
    }
  },
  "database": { "auto_cleanup_days": 7 }
}
```
