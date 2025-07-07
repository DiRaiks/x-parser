# X Parser

> AI-powered Twitter analysis tool with session-based parsing, thread analysis, and intelligent categorization for blockchain content

## ⚠️ Disclaimer

**This application is NOT a Twitter/X alternative and does not replace Twitter/X functionality.**

X Parser is a third-party analysis tool that:

- 📊 **Analyzes publicly available data** from Twitter/X using standard web interfaces
- 🔐 **Uses only user's own session cookies** to access content visible to that specific user
- 🚫 **Does NOT store, redistribute, or republish** Twitter/X content beyond personal analysis
- 🎯 **Serves as a personal analysis dashboard** for blockchain and cryptocurrency content
- 📝 **Operates within Twitter's Terms of Service** by accessing only user-visible content
- 🛡️ **Respects Twitter/X's platform boundaries** and does not attempt to replicate platform features

**For Developers**: This tool is designed for personal use and content analysis only. Users are responsible for compliance with Twitter/X Terms of Service when using their own authentication cookies. The application does not perform any unauthorized access, data scraping, or platform manipulation.

**For Twitter/X**: This application enhances user experience by providing analysis tools for content users already have access to, similar to browser extensions or personal dashboards. No platform features are replicated or circumvented.

**User responsibility**: Users are solely responsible for:

- ✅ Ensuring compliance with applicable Terms of Service
- ✅ Using their own valid authentication credentials
- ✅ Respecting rate limits and platform policies

---

![X Parser](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![OpenAI](https://img.shields.io/badge/OpenAI-API-green?style=for-the-badge&logo=openai)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

## ✨ Features

- 🚀 **Automatic Timeline Monitoring** - Continuous monitoring of your Twitter timeline with intelligent filtering
- 🔐 **Session-Based Parsing** - Use Twitter auth cookies for full access to tweets and comments
- 🤖 **Smart AI Analysis** - Automatic relevance filtering and on-demand detailed analysis
- 🧵 **Complete Thread Analysis** - Parse entire comment trees with pagination support
- 📊 **Thread Visualization** - Interactive display of comment hierarchies and thread statistics
- 🎯 **Smart Sentiment Analysis** - Analyze community reactions and sentiment patterns
- 🌐 **Multi-language Support** - Automatic translation and analysis (English/Russian)
- 📈 **Project Impact Analysis** - Configurable analysis for any project or protocol
- 💾 **Persistent Storage** - SQLite database with comprehensive tweet and thread data
- ⚙️ **Configurable Prompts** - Customizable AI analysis prompts via JSON configuration

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd x-parser
yarn install
```

### 2. Setup Configuration

```bash
# Initialize config files
yarn init-config

# Set up environment variables
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
```

### 3. Setup Database

```bash
yarn prisma db push
yarn prisma generate
```

### 4. Configure Twitter Session

1. Open Twitter in your browser and log in
2. Open Developer Tools (F12) → Network tab
3. Navigate to any Twitter page and find a request with cookies
4. Copy `auth_token` and `ct0` values from cookies
5. Go to Settings in the app and paste these values

### 5. Run

```bash
yarn dev
```

Visit `http://localhost:3000` 🎉

## 🔄 Workflow

### Automatic Mode (Recommended)

1. **Setup Monitoring**: Configure Twitter session credentials in Settings
2. **Start Auto-monitoring**: Enable automatic timeline monitoring (runs every 30 minutes)
3. **Intelligent Filtering**: AI automatically filters relevant tweets based on configured criteria
4. **Background Processing**: New tweets are added to database automatically
5. **Manual Analysis**: Click "Analyze" button for detailed AI analysis when needed

### Manual Mode

1. **Add Tweet**: Paste Twitter URL → automatic parsing with optional thread analysis
2. **Manual Analysis**: Click "Analyze" button when ready to run AI analysis
3. **Thread Exploration**: Expand thread structure to see comment hierarchies
4. **Sentiment Review**: Check community reactions and sentiment distribution

## 📊 Analysis Features

### Thread Structure

- **Complete Comment Trees**: Recursive parsing of all replies and nested comments
- **Pagination Support**: Handles large threads with automatic cursor-based pagination
- **Depth Analysis**: Shows maximum thread depth and reply patterns
- **Participant Tracking**: Identifies top contributors and engagement patterns

### AI Analysis

- **Relevance Scoring**: Determines content relevance to blockchain/crypto topics
- **Category Classification**: Automatically categorizes content (DeFi, NFT, Ethereum, etc.)
- **Sentiment Analysis**: Analyzes overall sentiment and community reactions
- **Project Impact Assessment**: Configurable analysis for any project or protocol
- **Translation**: Automatic translation to target language with context preservation

## 🔗 API Endpoints

| Method   | Endpoint                      | Description                     |
| -------- | ----------------------------- | ------------------------------- |
| `GET`    | `/api/tweets`                 | List tweets with filtering      |
| `POST`   | `/api/tweets`                 | Add new tweet                   |
| `DELETE` | `/api/tweets/{id}`            | Delete tweet                    |
| `POST`   | `/api/ai/analyze`             | Analyze tweet with AI (manual)  |
| `POST`   | `/api/auto-monitor`           | Auto-monitor timeline           |
| `GET`    | `/api/auto-monitor/control`   | Get monitoring status           |
| `POST`   | `/api/auto-monitor/control`   | Control monitoring (start/stop) |
| `POST`   | `/api/parser/twitter-session` | Parse tweet with session auth   |
| `POST`   | `/api/parser/timeline`        | Parse home timeline feed        |

## 📝 Configuration

The app uses JSON configuration files (not tracked in git):

- `config/app.json` - Application settings (AI models, timeouts, limits, auto-monitoring)
- `config/prompts.json` - AI prompts for analysis (fully customizable)

Key configuration options:

- **Auto-monitoring**: Configure monitoring intervals, filtering rules, and relevance thresholds
- **AI Model Selection**: Choose between GPT models for different use cases
- **Analysis Prompts**: Customize prompts for relevance, sentiment, and project impact analysis
- **Thread Parsing**: Configure depth limits and pagination settings
- **Session Management**: Twitter authentication configuration

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev), PostgreSQL (prod)
- **AI**: OpenAI GPT-4o-mini with configurable prompts
- **State**: Zustand for local state management
- **Parsing**: Session-based Twitter API access with Bearer token fallback

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation and configuration
- [API Reference](docs/API.md) - Complete API documentation
- [Configuration](docs/CONFIGURATION.md) - Advanced configuration options

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the crypto community**
