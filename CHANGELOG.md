# Changelog

All notable changes to X Parser will be documented in this file.

## [1.1.0] - 2024-12-XX

### Added

🔢 **Advanced Tweet Sorting**

- 7 sorting options for tweet lists
- Sort by publication date (newest/oldest)
- Sort by engagement metrics (likes, retweets, replies)
- Sort by database addition time (recently/first added)
- UI dropdown for easy sort selection
- API parameter `sort` for programmatic access
- Proper handling of mixed date formats (ISO/Unix timestamp)

🤖 **Telegram Bot Integration**

- New Telegram bot in `telegram/` directory
- Automatic notifications for relevant tweets
- Batch message sending every 30 minutes
- AI analysis with translation and summary in Telegram format
- Administrative commands: `/start`, `/status`, `/monitor`, `/fetch`, `/reset`, `/analyze`
- Full integration with main application (database, AI, configuration)
- Multi-language support (Russian and English)
- Configurable message formats (brief/detailed)
- Automatic setup via scripts
- Deployment documentation (PM2, SystemD, Docker)

### Technical

- TypeScript with full type safety
- Telegraf.js for Telegram API integration
- node-cron for task scheduling
- Integration with existing auto-monitor services
- Graceful shutdown and error handling
- Configuration via environment variables

### Scripts

- `yarn bot:setup` - bot setup and configuration
- `yarn bot:dev` - development mode
- `yarn bot:start` - production startup
- `telegram/scripts/setup.sh` - automatic setup
- `telegram/scripts/start.sh` - startup with health checks

---

## [1.0.0] - Previous version

### Features

- AI-powered Twitter analysis tool
- Session-based parsing
- Thread analysis
- Multi-language support (English/Russian)
- Automatic timeline monitoring
- Manual AI analysis workflow
- Configurable prompts via JSON
