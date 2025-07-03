# Configuration Guide

Complete configuration reference for X Parser.

## Overview

X Parser uses JSON configuration files to customize AI behavior, parsing settings, and application features. Configuration files are stored in the `config/` directory and are not tracked in git.

## Configuration Files

### `config/app.json`

Main application settings including AI models, parsing limits, and behavior.

### `config/prompts.json`

AI prompts for different analysis tasks - fully customizable.

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
      "relevance": 150,
      "translation": 500,
      "summary": 300,
      "thread_analysis": 400
    }
  },
  "parsing": {
    "max_tweets_per_fetch": 50,
    "fetch_interval_minutes": 5,
    "max_retries": 3,
    "request_timeout_ms": 30000,
    "rate_limit_delay_ms": 3000
  },
  "analysis": {
    "default_language": "en",
    "supported_languages": ["en", "ru"],
    "auto_translate": true,
    "relevance_threshold": 0.6
  },
  "database": {
    "auto_cleanup_days": 30,
    "backup_interval_hours": 24
  }
}
```

### OpenAI Settings

Configure AI model behavior:

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
      "relevance": 150, // Brief relevance analysis
      "translation": 500, // Full translation space
      "summary": 300, // Concise summaries
      "thread_analysis": 400 // Detailed thread analysis
    }
  }
}
```

**Available Models:**

- `gpt-4o-mini` (recommended) - Fast and cost-effective
- `gpt-4o` - More capable but slower/expensive
- `gpt-4-turbo` - Balanced performance
- `gpt-3.5-turbo` - Budget option

### Parsing Settings

Control parsing behavior and limits:

```json
{
  "parsing": {
    "max_tweets_per_fetch": 50, // Max tweets per timeline fetch
    "fetch_interval_minutes": 5, // Automatic fetch interval
    "max_retries": 3, // Retry failed requests
    "request_timeout_ms": 30000, // Request timeout (30s)
    "rate_limit_delay_ms": 3000 // Delay between requests (3s)
  }
}
```

### Analysis Settings

Configure AI analysis features:

```json
{
  "analysis": {
    "default_language": "en", // Default target language
    "supported_languages": ["en", "ru"], // Available languages
    "auto_translate": true, // Auto-translate non-English
    "relevance_threshold": 0.6 // Minimum relevance score
  }
}
```

**Language Codes:**

- `en` - English
- `ru` - Russian

### Database Settings

Database management options:

```json
{
  "database": {
    "auto_cleanup_days": 30, // Auto-delete old tweets
    "backup_interval_hours": 24 // Database backup frequency
  }
}
```

## Prompt Configuration (`config/prompts.json`)

### Complete Example

```json
{
  "relevance_checker": {
    "system": "You are an expert in blockchain and cryptocurrency. Analyze tweets for relevance to Ethereum ecosystem, DeFi, and Lido protocol.",
    "user": "Analyze this tweet for relevance:\n\nContent: {content}\n\nRespond with JSON: {\"relevance_score\": 0.0-1.0, \"is_relevant\": boolean, \"categories\": [\"category1\"], \"reason\": \"explanation\"}"
  },
  "translator": {
    "system": "You are a professional translator specializing in cryptocurrency and blockchain terminology.",
    "user": "Translate this tweet to {target_language}. Preserve technical terms and context:\n\n{content}"
  },
  "summarizer": {
    "system": "You are a blockchain expert providing analysis for the Lido community. Focus on protocol implications and opportunities.",
    "user": "Analyze this tweet and replies. Provide expert commentary on implications for Lido protocol:\n\nTweet: {content}\n\nReplies: {replies}\n\nRespond with JSON containing summary, expert_comment, impact_level, and lido_impact analysis."
  },
  "thread_analyzer": {
    "system": "You are a social media analyst specializing in cryptocurrency communities. Analyze discussion threads for sentiment and key insights.",
    "user": "Analyze this Twitter thread discussion:\n\nOriginal: {content}\n\nReplies: {replies}\n\nProvide JSON analysis with total_replies, sentiment_breakdown, community_pulse, key_topics, and engagement_level."
  }
}
```

### Customizing Prompts

#### Relevance Checker

Controls how AI determines tweet relevance:

```json
{
  "relevance_checker": {
    "system": "Custom system prompt defining expertise area...",
    "user": "Analysis request format with {content} placeholder..."
  }
}
```

**Placeholders:**

- `{content}` - Tweet content
- `{author}` - Tweet author
- `{engagement}` - Like/retweet counts

#### Translator

Controls translation behavior:

```json
{
  "translator": {
    "system": "Define translation style and expertise...",
    "user": "Translation request with {content} and {target_language}..."
  }
}
```

**Placeholders:**

- `{content}` - Text to translate
- `{target_language}` - Target language name
- `{source_language}` - Detected source language

#### Summarizer

Controls tweet and thread summarization:

```json
{
  "summarizer": {
    "system": "Define analysis perspective and goals...",
    "user": "Analysis request with {content} and {replies}..."
  }
}
```

**Placeholders:**

- `{content}` - Main tweet content
- `{replies}` - Formatted replies list
- `{author}` - Tweet author info
- `{engagement}` - Engagement metrics

#### Thread Analyzer

Controls thread discussion analysis:

```json
{
  "thread_analyzer": {
    "system": "Define community analysis approach...",
    "user": "Thread analysis request with placeholders..."
  }
}
```

**Placeholders:**

- `{content}` - Original tweet
- `{replies}` - All thread replies
- `{participants}` - Unique participants
- `{total_engagement}` - Total thread engagement

## Environment Variables

Required environment configuration:

```env
# Required
OPENAI_API_KEY="sk-..." # OpenAI API key

# Database
DATABASE_URL="file:./dev.db" # SQLite (dev) or PostgreSQL (prod)

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000" # App URL for absolute links
```

## Configuration Examples

### High-Volume Analysis

For processing many tweets with fast analysis:

```json
{
  "openai": {
    "model": "gpt-4o-mini",
    "temperatures": {
      "relevance": 0.2,
      "summary": 0.3
    },
    "max_tokens": {
      "relevance": 100,
      "summary": 200
    }
  },
  "parsing": {
    "max_tweets_per_fetch": 100,
    "rate_limit_delay_ms": 1000
  }
}
```

### Detailed Analysis

For thorough analysis with detailed insights:

```json
{
  "openai": {
    "model": "gpt-4o",
    "temperatures": {
      "summary": 0.7,
      "thread_analysis": 0.6
    },
    "max_tokens": {
      "summary": 500,
      "thread_analysis": 600
    }
  },
  "analysis": {
    "relevance_threshold": 0.4
  }
}
```

### Multi-language Setup

For international content analysis:

```json
{
  "analysis": {
    "default_language": "en",
    "supported_languages": ["en", "ru", "es", "fr", "de", "zh"],
    "auto_translate": true
  }
}
```

## Best Practices

### Model Selection

- **Development**: Use `gpt-4o-mini` for cost efficiency
- **Production**: Use `gpt-4o` for better analysis quality
- **High-volume**: Use `gpt-3.5-turbo` for speed

### Temperature Settings

- **Relevance (0.1-0.3)**: Low for consistent categorization
- **Translation (0.1-0.2)**: Low for accurate translations
- **Summary (0.4-0.7)**: Medium for balanced creativity
- **Analysis (0.3-0.6)**: Medium for insightful commentary

### Rate Limiting

- **Twitter Parsing**: 2-5 seconds between requests
- **AI Analysis**: Respect OpenAI rate limits
- **Database**: Enable auto-cleanup for large datasets

### Prompt Engineering

- Use specific domain expertise in system prompts
- Include clear output format requirements
- Test prompts with sample data before production
- Keep prompts focused and concise

## Troubleshooting

### Configuration Issues

**Invalid JSON syntax:**

```bash
# Validate JSON
cat config/app.json | jq .
```

**Missing required fields:**

- Ensure all required configuration sections exist
- Check for typos in field names
- Verify data types match expected values

**OpenAI errors:**

- Verify API key is valid and has credits
- Check model availability and permissions
- Monitor rate limits and token usage

### Performance Optimization

**Slow AI analysis:**

- Reduce `max_tokens` limits
- Lower temperature values
- Use faster models (gpt-4o-mini)

**High API costs:**

- Increase `relevance_threshold` to filter more tweets
- Reduce `max_tweets_per_fetch`
- Optimize prompt lengths

## Updates and Migration

### Configuration Migration

When updating the application:

1. Backup existing configuration:

   ```bash
   cp config/app.json config/app.json.backup
   ```

2. Run configuration update:

   ```bash
   yarn init-config
   ```

3. Merge custom settings from backup

### Prompt Updates

Regularly review and update prompts for:

- Better analysis quality
- New use cases or requirements
- Improved output formats
- Cost optimization

---

For more configuration examples and advanced setups, see the [Setup Guide](SETUP.md) and [API Reference](API.md).
