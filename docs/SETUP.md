# Setup Guide

Complete installation and configuration guide for X Parser with session-based parsing and manual AI analysis.

## Prerequisites

- Node.js 18+ and yarn/npm
- OpenAI API account and key
- Twitter account with valid session cookies
- Basic understanding of browser developer tools

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd x-parser
yarn install
```

### 2. Environment Setup

Create `.env` file:

```bash
cp .env.example .env
```

Required environment variables:

```env
# OpenAI API (Required)
OPENAI_API_KEY="your-openai-api-key-here"

# Database
DATABASE_URL="file:./dev.db"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Configuration Files

Initialize configuration:

```bash
yarn init-config
```

This creates:

- `config/app.json` - Application settings (models, timeouts, limits)
- `config/prompts.json` - AI analysis prompts (fully customizable)

**Important**: These files are not tracked in git and contain your customizations.

### 4. Database Setup

```bash
# Create database and tables
yarn prisma db push

# Generate Prisma client
yarn prisma generate

# (Optional) View database
yarn prisma studio
```

### 5. Twitter Session Setup (Critical)

Session-based parsing is required for full functionality:

#### Method 1: Browser Developer Tools

1. **Open Twitter** in your browser and log in
2. **Open Developer Tools** (F12)
3. **Go to Application tab → Cookies → https://x.com**
4. **Copy these values**:
   - `auth_token` (long string starting with numbers/letters)
   - `ct0` (CSRF token, shorter alphanumeric string)
5. **Keep these safe** - you'll enter them in the app settings

#### Method 2: Network Tab

1. **Open Twitter** and go to Developer Tools → Network tab
2. **Navigate to any Twitter page** or refresh
3. **Find any request** to Twitter API
4. **Look at Request Headers** for:
   - `Authorization: Bearer ...` (not needed, app has this)
   - `Cookie:` header containing `auth_token=...` and `ct0=...`
5. **Extract the values** after `auth_token=` and `ct0=`

### 6. Start Development Server

```bash
yarn dev
```

Application available at: http://localhost:3000

## Initial Configuration

### 1. Open Settings in App

Click the gear icon in the top-right corner.

### 2. Enter Twitter Session Data

- Paste `auth_token` value
- Paste `ct0` (CSRF token) value
- Save settings

### 3. Test Tweet Parsing

- Click "Add Tweet"
- Paste any Twitter URL
- Enable "Include comments analysis" for full thread parsing
- Click "Add"

### 4. Set Up Auto-Monitoring (Recommended)

- In the main page, find "Twitter Timeline Monitor" section
- Click "Start Monitoring" to enable automatic timeline monitoring
- System will check your timeline every 30 minutes for new relevant tweets
- Use "Run Now" for immediate manual check

### 5. Manual AI Analysis

- After tweets are added (automatically or manually), click "Analyze" button
- AI will analyze tweet content and thread structure
- Results include relevance, categories, sentiment analysis, and project impact

## Configuration

### App Settings (`config/app.json`)

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
    }
  },
  "parsing": {
    "max_tweets_per_fetch": 50,
    "fetch_interval_minutes": 5,
    "max_retries": 3,
    "thread_parsing": {
      "max_depth": 3,
      "max_replies_per_level": 50,
      "pagination_timeout": 30000
    }
  },
  "analysis": {
    "default_language": "en",
    "supported_languages": ["en", "ru"],
    "manual_analysis": true,
    "auto_analysis": false
  },
  "auto_monitoring": {
    "enabled": true,
    "interval_minutes": 30,
    "max_tweets_per_check": 50,
    "auto_add_relevant_only": true,
    "min_relevance_score": 0.5,
    "skip_retweets": true,
    "skip_replies": false
  }
}
```

### AI Prompts (`config/prompts.json`)

Customize AI prompts for different analysis types:

```json
{
  "relevance_checker": {
    "system": "You are an expert in blockchain and cryptocurrency...",
    "user_template": "Analyze this tweet for relevance: {content}"
  },
  "translator": {
    "system": "You are a professional translator...",
    "user_template": "Translate to {target_lang}: {content}"
  },
  "summarizer": {
    "system": "You are an expert analyst...",
    "user_template": "Analyze and summarize: {content}"
  },
  "thread_analyzer": {
    "system": "You are a social media expert...",
    "user_template": "Analyze this thread structure: {thread_data}"
  }
}
```

## Advanced Features

### Automatic Timeline Monitoring

The app provides intelligent automated monitoring of your Twitter timeline:

- **Continuous Monitoring**: Automatically checks timeline every 30 minutes
- **Smart Filtering**: Uses AI to filter relevant tweets based on configured criteria
- **Relevance Scoring**: Only adds tweets above configured relevance threshold
- **Duplicate Prevention**: Automatically skips tweets already in database
- **Background Processing**: Runs in browser background without manual intervention
- **Real-time Status**: Shows monitoring statistics and last run information

**Configuration Options:**

- `interval_minutes`: How often to check (15-180 minutes)
- `max_tweets_per_check`: Limit tweets processed per run (10-100)
- `auto_add_relevant_only`: Only add tweets passing relevance check
- `min_relevance_score`: Threshold for automatic addition (0.0-1.0)
- `skip_retweets`: Focus on original content only
- `skip_replies`: Include/exclude replies to followed accounts

### Thread Structure Analysis

The app now provides comprehensive thread analysis:

- **Complete Comment Trees**: Recursive parsing of all replies
- **Pagination Handling**: Automatic fetching of large comment threads
- **Depth Analysis**: Shows conversation flow and engagement patterns
- **Participant Tracking**: Identifies most active contributors
- **Sentiment Distribution**: Analyzes community reactions

### Manual AI Analysis Workflow

1. **Add tweets** without automatic analysis (faster, saves tokens)
2. **Review raw content** and thread structure
3. **Run AI analysis** selectively on interesting tweets
4. **Customize prompts** for specific analysis needs

### Session Management

- **Session Persistence**: Credentials saved locally in browser
- **Automatic Validation**: App checks session validity
- **Refresh Indicators**: Clear feedback when sessions expire
- **Fallback Handling**: Graceful degradation when sessions fail

## Production Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables**:
   ```
   OPENAI_API_KEY=your-key
   DATABASE_URL=your-postgres-url
   ```
3. **Configure build settings**:
   ```
   Build Command: yarn build
   Output Directory: .next
   ```
4. **Deploy** automatically

### Docker

```dockerfile
# Use in production
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
```

```bash
# Build and run
docker build -t x-parser .
docker run -p 3000:3000 \
  -e OPENAI_API_KEY="your-key" \
  -e DATABASE_URL="your-db-url" \
  x-parser
```

### Self-hosted

```bash
# Production build
yarn build

# Start production server
yarn start

# With PM2 (recommended)
pm2 start yarn --name "x-parser" -- start
```

## Troubleshooting

### Common Issues

**Session Authentication Fails**

- Check if Twitter session cookies are still valid
- Try logging out and back into Twitter
- Copy fresh `auth_token` and `ct0` values
- Ensure no extra characters in copied values

**AI Analysis Errors**

- Verify OpenAI API key is valid and has credits
- Check rate limits (both OpenAI and app-level)
- Review custom prompts for syntax errors
- Enable debug mode for detailed error logs

**Auto-Monitoring Issues**

- Verify Twitter session credentials are valid and current
- Check if monitoring is enabled in `config/app.json`
- Ensure browser tab stays open (monitoring runs in browser)
- Review relevance threshold - may be filtering all tweets
- Check rate limits - may need to reduce `max_tweets_per_check`

**Thread Parsing Issues**

- Ensure "Include comments analysis" is enabled
- Check if tweet has public replies
- Verify session has access to view replies
- Large threads may take time due to pagination

**Database Connection Problems**

- Run `yarn prisma db push` to reset schema
- Check file permissions for SQLite database
- Verify DATABASE_URL format and accessibility
- Clear Prisma cache: `yarn prisma generate`

**Configuration File Errors**

- Re-run `yarn init-config` to restore defaults
- Validate JSON syntax in config files
- Check file permissions for config directory
- Compare with example files in git

### Performance Optimization

**Large Thread Handling**

- Set reasonable `max_depth` and `max_replies_per_level`
- Use pagination timeouts to prevent hangs
- Monitor memory usage with large datasets
- Consider database indexing for better performance

**OpenAI Token Usage**

- Use manual analysis to control costs
- Customize prompts to be more concise
- Set appropriate `max_tokens` limits
- Monitor usage through OpenAI dashboard

### Debugging and Logs

Enable detailed logging:

```json
// In config/app.json
{
  "debug": {
    "enabled": true,
    "level": "verbose",
    "log_requests": true,
    "log_responses": false
  }
}
```

Check different log levels:

```bash
# Development with debug
DEBUG=* yarn dev

# Production logs
tail -f logs/app.log
```

### Recovery Procedures

**Reset Configuration**

```bash
# Backup current config
cp config/app.json config/app.json.backup

# Reset to defaults
yarn init-config

# Restore custom settings manually
```

**Database Reset**

```bash
# Backup data
yarn prisma db seed

# Reset schema
yarn prisma db push --force-reset

# Restore data
yarn prisma db restore
```

**Session Refresh**

1. Clear browser Twitter cookies
2. Log back into Twitter
3. Copy fresh session tokens
4. Update app settings
5. Test with simple tweet

## Next Steps

- Review [API Documentation](API.md)
- Explore [Configuration Options](CONFIGURATION.md)
- Join our community discussions
