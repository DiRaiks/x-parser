# Setup Guide

Complete installation and configuration guide for X Parser.

## Prerequisites

- Node.js 18+ and yarn/npm
- OpenAI API account and key
- Twitter account (for session-based parsing)

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

- `config/app.json` - Application settings
- `config/prompts.json` - AI prompts

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

### 5. Start Development Server

```bash
yarn dev
```

Application available at: http://localhost:3000

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
    }
  },
  "parsing": {
    "max_tweets_per_fetch": 50,
    "fetch_interval_minutes": 5,
    "max_retries": 3
  },
  "analysis": {
    "default_language": "en",
    "supported_languages": ["en", "ru"]
  }
}
```

### AI Prompts (`config/prompts.json`)

Customize AI prompts for:

- `relevance_checker` - Determines tweet relevance
- `translator` - Language translation
- `summarizer` - Tweet summarization
- `thread_analyzer` - Thread analysis

## Twitter Session Setup

For session-based parsing (recommended):

1. **Log into Twitter** in your browser
2. **Open Developer Tools** (F12)
3. **Navigate to Application → Cookies → https://x.com**
4. **Copy values** for:
   - `auth_token`
   - `ct0` (CSRF token)
5. **Enter in Settings** within the app

## Production Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** automatically

### Docker

```bash
# Build image
docker build -t x-parser .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY="your-key" \
  x-parser
```

### Self-hosted

```bash
# Build for production
yarn build

# Start production server
yarn start
```

## Troubleshooting

### Common Issues

**OpenAI API Errors**

- Verify API key is valid
- Check OpenAI account has credits
- Ensure rate limits aren't exceeded

**Twitter Parsing Fails**

- Update session cookies (they expire)
- Try different Twitter username
- Check network connectivity

**Database Issues**

- Run `yarn prisma db push`
- Check file permissions for SQLite
- Verify DATABASE_URL format

**Configuration Errors**

- Run `yarn init-config` again
- Check JSON syntax in config files
- Verify file permissions

### Logs and Debugging

Enable debug mode in AI analysis:

```json
{
  "tweetId": "123",
  "content": "tweet content",
  "debug": true
}
```

Check application logs:

```bash
# Development
yarn dev

# Production
yarn start
```

## Advanced Configuration

### Custom AI Models

Edit `config/app.json`:

```json
{
  "openai": {
    "model": "gpt-4",
    "temperatures": {
      "relevance": 0.2
    }
  }
}
```

### Database Migration

Switch to PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/xparser"
```

Then run:

```bash
yarn prisma db push
```

### Rate Limiting

Configure in `config/app.json`:

```json
{
  "twitter": {
    "rate_limit_delay_ms": 3000
  },
  "parsing": {
    "request_timeout_ms": 30000
  }
}
```

## Next Steps

- Review [API Documentation](API.md)
- Explore [Configuration Options](CONFIGURATION.md)
- Join our community discussions
