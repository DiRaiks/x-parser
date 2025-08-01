#!/bin/bash

# X Parser Telegram Bot Startup Script

echo "🤖 X Parser Telegram Bot"
echo "========================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy env-example.txt to .env and configure:"
    echo "   cp env-example.txt .env"
    echo "   nano .env"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if dist directory exists (for production)
if [ ! -d "dist" ] && [ "$NODE_ENV" = "production" ]; then
    echo "🔨 Building bot..."
    npm run build
fi

# Start the bot
echo "🚀 Starting bot..."
if [ "$NODE_ENV" = "production" ]; then
    npm start
else
    npm run dev
fi 