# X Parser Telegram Bot

Telegram бот для автоматического мониторинга и анализа твиттов с использованием AI.

## 🚀 Установка

### 1. Установка зависимостей

```bash
cd telegram
npm install
# или
yarn install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните обязательные переменные:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here         # Токен от @BotFather
TELEGRAM_CHAT_ID=your_chat_id_here             # ID чата для уведомлений
TELEGRAM_ADMIN_ID=your_admin_user_id_here      # ID администратора

# Twitter Session (для мониторинга)
TWITTER_AUTH_TOKEN=your_twitter_auth_token     # Из cookies браузера
TWITTER_CSRF_TOKEN=your_twitter_csrf_token     # ct0 из cookies браузера

# OpenAI API (тот же что в основном приложении)
OPENAI_API_KEY=your_openai_api_key

# База данных (та же что у основного приложения)
DATABASE_URL=file:../prisma/dev.db

# Настройки бота (опционально)
BOT_MONITORING_INTERVAL_MINUTES=30             # Интервал мониторинга
BOT_MESSAGE_FORMAT=detailed                    # brief или detailed
BOT_LANGUAGE=ru                                # ru или en
```

### 3. Получение Telegram токена

1. Напишите @BotFather в Telegram
2. Отправьте `/newbot`
3. Выберите имя и username для бота
4. Скопируйте токен в `TELEGRAM_BOT_TOKEN`

### 4. Получение Chat ID

1. Добавьте бота в нужный чат/канал
2. Отправьте любое сообщение в чат
3. Откройте: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Найдите `chat.id` в ответе
5. Скопируйте значение в `TELEGRAM_CHAT_ID`

### 5. Получение Admin ID

1. Напишите @userinfobot в Telegram
2. Отправьте `/start`
3. Скопируйте ваш ID в `TELEGRAM_ADMIN_ID`

### 6. Получение Twitter session токенов

Те же токены что используются в основном приложении:

1. **Откройте Twitter** в браузере и войдите в аккаунт
2. **Откройте Developer Tools** (F12) → Application → Cookies → https://x.com
3. **Скопируйте значения**:
   - `auth_token` → в `TWITTER_AUTH_TOKEN`
   - `ct0` → в `TWITTER_CSRF_TOKEN`

⚠️ **Важно**: Используйте те же токены что в основном приложении для синхронизации.

## 🚀 Альтернативные способы запуска

### Через основное приложение

```bash
# Из корневой папки x-parser
yarn bot:setup    # Установить зависимости
yarn bot:dev      # Запуск в development режиме
yarn bot:start    # Запуск в production режиме
```

### Автоматическая настройка

```bash
cd telegram
./scripts/setup.sh    # Автоматическая настройка
./scripts/start.sh     # Запуск с проверками
```

## 🔗 Интеграция с основным приложением

### Общие ресурсы

- **База данных**: Использует ту же SQLite/PostgreSQL
- **AI анализ**: Использует те же API endpoints
- **Конфигурация**: Читает `config/app.json` и `config/prompts.json`
- **Session токены**: Те же что в веб-приложении

### Рабочий процесс

1. **Основное приложение** добавляет новые твиты через auto-monitor
2. **AI анализ** обрабатывает твиты (автоматически или вручную)
3. **Бот проверяет** базу каждые 30 минут на новые обработанные твиты
4. **Уведомления** отправляются батчами в Telegram чат

### API интеграция

Бот использует следующие endpoints основного приложения:

- `POST /api/auto-monitor` - Запуск мониторинга Twitter
- `POST /api/ai/analyze` - AI анализ твиттов (планируется)
- Прямой доступ к базе данных через Prisma

## 📱 Команды бота

- `/start` - Запуск бота и справка
- `/status` - Статус мониторинга и статистика
- `/monitor start` - Запустить мониторинг
- `/monitor stop` - Остановить мониторинг
- `/fetch` - **Запустить парсинг новых твиттов прямо сейчас**
- `/analyze <url>` - Проанализировать конкретный твитт

## 🔄 Как работает

1. **Автомониторинг**: Каждые 30 минут проверяет базу данных на новые твиты
2. **AI анализ**: Использует те же AI функции что и основное приложение
3. **Уведомления**: Отправляет батчи новых релевантных твиттов в чат
4. **Интеграция**: Полностью интегрирован с основным X Parser приложением

## ⚙️ Настройки

Бот использует ту же конфигурацию что и основное приложение:

- `config/app.json` - настройки AI и мониторинга
- `config/prompts.json` - промпты для анализа

## 🗄️ База данных

Использует ту же SQLite/PostgreSQL базу что и основное приложение.
Никаких дополнительных таблиц не требуется.

## 🔒 Безопасность

- Только администратор может управлять ботом
- Twitter session токены хранятся в переменных окружения
- Интеграция с существующей системой аутентификации

## 🐛 Решение проблем

### Бот не отвечает

- Проверьте правильность `TELEGRAM_BOT_TOKEN`
- Убедитесь что бот запущен

### Нет уведомлений

- Проверьте `TELEGRAM_CHAT_ID`
- Убедитесь что бот добавлен в чат
- Проверьте настройки мониторинга в основном приложении

### Ошибки Twitter API

- Обновите `TWITTER_AUTH_TOKEN` и `TWITTER_CSRF_TOKEN`
- Проверьте что cookies актуальны

### Ошибки AI анализа

- Проверьте `OPENAI_API_KEY`
- Убедитесь что есть средства на счету OpenAI

## ⚙️ Продвинутая настройка

### Настройка интервала мониторинга

В `.env`:

```env
BOT_MONITORING_INTERVAL_MINUTES=15  # Каждые 15 минут (минимум 5)
```

Или в `config/app.json` (основного приложения):

```json
{
  "auto_monitoring": {
    "interval_minutes": 15
  }
}
```

### Настройка языка и формата

В `.env`:

```env
BOT_LANGUAGE=en                 # en или ru
BOT_MESSAGE_FORMAT=brief        # brief или detailed
```

### Запуск как системный сервис

#### SystemD (Linux)

Создайте `/etc/systemd/system/x-parser-bot.service`:

```ini
[Unit]
Description=X Parser Telegram Bot
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/x-parser/telegram
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Затем:

```bash
sudo systemctl enable x-parser-bot
sudo systemctl start x-parser-bot
sudo systemctl status x-parser-bot
```

#### PM2 (Process Manager)

```bash
# Установить PM2 глобально
npm install -g pm2

# Запустить бота
cd telegram
pm2 start dist/index.js --name "x-parser-bot"

# Настроить автозапуск
pm2 startup
pm2 save
```
