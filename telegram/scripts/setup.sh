#!/bin/bash

# X Parser Telegram Bot Setup Script

echo "🛠️  X Parser Telegram Bot Setup"
echo "================================"

# Check if we're in the telegram directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the telegram directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing bot dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env-example.txt .env
    echo "✅ Created .env file"
    echo ""
    echo "🔧 Please edit .env file with your configuration:"
    echo "   - Get bot token from @BotFather"
    echo "   - Set chat ID for notifications"
    echo "   - Set admin user ID"
    echo "   - Configure Twitter session tokens"
    echo "   - Set OpenAI API key"
    echo ""
    echo "📝 Edit with: nano .env"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client (from parent directory)
echo "🗄️  Generating database client..."
cd ..
npx prisma generate
cd telegram

echo ""
echo "✅ Setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Ensure main X Parser app database is set up"
echo "   3. Run: npm run dev (for development)"
echo "   4. Or run: ./scripts/start.sh (with auto-setup)"
echo ""
echo "🔗 Documentation: see README.md" 