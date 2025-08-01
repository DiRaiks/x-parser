# Deployment Guide для X Parser Telegram Bot

Руководство по развертыванию Telegram бота в различных окружениях.

## 🚀 Quick Start (Локальная разработка)

```bash
# 1. Клонировать проект и перейти в папку бота
git clone <repo> && cd x-parser/telegram

# 2. Автоматическая настройка
./scripts/setup.sh

# 3. Настроить .env файл
nano .env

# 4. Запустить
npm run dev
```

## 🏭 Production Deployment

### Option 1: PM2 (Рекомендуется)

```bash
# Установить PM2
npm install -g pm2

# Подготовить production сборку
npm run build

# Запустить с PM2
pm2 start dist/index.js --name "x-parser-bot" \
  --env NODE_ENV=production \
  --max-memory-restart 500M \
  --restart-delay 5000

# Настроить автозапуск при перезагрузке системы
pm2 startup
pm2 save

# Логи
pm2 logs x-parser-bot
pm2 monit
```

### Option 2: SystemD Service

Создайте `/etc/systemd/system/x-parser-bot.service`:

```ini
[Unit]
Description=X Parser Telegram Bot
After=network.target
Wants=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/x-parser/telegram
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=x-parser-bot
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5

[Install]
WantedBy=multi-user.target
```

Активация:

```bash
sudo systemctl enable x-parser-bot
sudo systemctl start x-parser-bot
sudo systemctl status x-parser-bot

# Логи
sudo journalctl -u x-parser-bot -f
```

### Option 3: Docker

Создайте `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Копировать package files
COPY package*.json ./
RUN npm ci --only=production

# Копировать исходный код
COPY . .

# Собрать TypeScript
RUN npm run build

# Пользователь без прав root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001
USER botuser

EXPOSE 3000

CMD ["npm", "start"]
```

`docker-compose.yml`:

```yaml
version: "3.8"
services:
  x-parser-bot:
    build: .
    env_file: .env
    restart: unless-stopped
    volumes:
      - ../prisma:/app/../prisma:ro
    depends_on:
      - database

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: xparser
      POSTGRES_USER: xparser
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Запуск:

```bash
docker-compose up -d
docker-compose logs -f x-parser-bot
```

## ☁️ Cloud Deployment

### Heroku

1. **Подготовка**:

```bash
heroku create x-parser-bot-your-name
heroku addons:create heroku-postgresql:mini
```

2. **Переменные окружения**:

```bash
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set TELEGRAM_CHAT_ID=your_chat_id
heroku config:set TELEGRAM_ADMIN_ID=your_admin_id
heroku config:set TWITTER_AUTH_TOKEN=your_twitter_token
heroku config:set TWITTER_CSRF_TOKEN=your_csrf_token
heroku config:set OPENAI_API_KEY=your_openai_key
```

3. **Деплой**:

```bash
git subtree push --prefix=telegram heroku main
```

### Railway

1. **Подключить GitHub** репозиторий
2. **Выбрать папку** `telegram` как root directory
3. **Настроить переменные** в веб-интерфейсе
4. **Автоматический деплой** при push

### VPS/Dedicated Server

```bash
# 1. Подготовить сервер
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git

# 2. Клонировать и настроить
git clone <repo> && cd x-parser/telegram
npm install
cp env-example.txt .env
nano .env

# 3. Собрать
npm run build

# 4. Настроить nginx (опционально)
sudo apt install nginx
# Создать конфиг для reverse proxy если нужно

# 5. Запустить с PM2
npm install -g pm2
pm2 start dist/index.js --name x-parser-bot
pm2 startup
pm2 save
```

## 🔧 Environment Configuration

### Обязательные переменные

```env
# Telegram
TELEGRAM_BOT_TOKEN=110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_ADMIN_ID=123456789

# Twitter
TWITTER_AUTH_TOKEN=your_long_auth_token_from_cookies
TWITTER_CSRF_TOKEN=your_csrf_token_from_cookies

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/xparser
```

### Опциональные переменные

```env
# Bot Settings
BOT_MONITORING_INTERVAL_MINUTES=30
BOT_MESSAGE_FORMAT=detailed
BOT_LANGUAGE=ru

# Performance
NODE_ENV=production
BOT_MAX_MEMORY=512

# Logging
LOG_LEVEL=info
ENABLE_DEBUG=false
```

## 📊 Monitoring & Maintenance

### Health Checks

Создайте простой health check endpoint:

```typescript
// health.ts
export async function healthCheck() {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: await databaseService.checkConnection(),
    telegram: await bot.telegram.getMe(),
  };
}
```

### Логирование

```bash
# PM2 логи
pm2 logs x-parser-bot --lines 100

# SystemD логи
sudo journalctl -u x-parser-bot -f --lines 100

# Docker логи
docker-compose logs -f x-parser-bot
```

### Backup & Recovery

```bash
# Backup базы данных (PostgreSQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup конфигурации
tar -czf config_backup.tar.gz .env config/
```

### Автоматические обновления

Создайте скрипт `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🔄 Updating X Parser Bot..."

# Остановить бота
pm2 stop x-parser-bot

# Обновить код
git pull origin main

# Установить зависимости
npm ci --only=production

# Собрать
npm run build

# Запустить
pm2 start x-parser-bot

echo "✅ Update completed!"
```

## 🚨 Troubleshooting

### Частые проблемы

1. **Бот не отвечает**:

   - Проверить токен: `curl https://api.telegram.org/bot<TOKEN>/getMe`
   - Проверить логи: `pm2 logs x-parser-bot`

2. **Нет доступа к чату**:

   - Убедиться что бот добавлен в чат
   - Проверить права администратора

3. **Ошибки Twitter API**:

   - Обновить session токены
   - Проверить rate limits

4. **Ошибки базы данных**:
   - Проверить соединение
   - Выполнить `npx prisma generate`

### Диагностика

```bash
# Проверить статус
pm2 status

# Проверить логи в реальном времени
pm2 logs x-parser-bot --lines 0

# Перезапустить если завис
pm2 restart x-parser-bot

# Полная перезагрузка
pm2 delete x-parser-bot
pm2 start dist/index.js --name x-parser-bot
```

## 📈 Performance Tuning

### Memory Optimization

```bash
# Ограничить память PM2
pm2 start dist/index.js --name x-parser-bot --max-memory-restart 400M

# Мониторинг использования памяти
pm2 monit
```

### Database Optimization

```sql
-- Индексы для ускорения запросов
CREATE INDEX idx_tweets_saved_at ON tweets(savedAt);
CREATE INDEX idx_tweets_relevant ON tweets(isRelevant);
CREATE INDEX idx_tweets_processed ON tweets(isProcessed);
```

### Rate Limiting

В коде бота уже есть задержки между сообщениями. Для production можно настроить:

```typescript
// В bot-notification.ts
const DELAY_BETWEEN_MESSAGES = 1500; // мс
const MAX_MESSAGES_PER_MINUTE = 20;
```
