# Blockful Telegram Bot

A Telegram bot that helps users track and receive notifications about DAOs they're interested in.

## Prerequisites

- Node.js (v14 or higher)
- npm
- A Telegram Bot Token (get it from [@BotFather](https://t.me/BotFather))

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your Telegram Bot Token:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Running the Bot

1. Start the bot in development mode:
```bash
npm run dev
```

2. For production:
```bash
npm start
```

## Available Commands

- `/start` - Start the bot and see welcome message
- `/help` - See available commands and how to use them
- `/DAOsToTrack` - Select which DAOs you want to track

## Development

The project structure is organized as follows:

```
src/
├── commands/     # Bot commands and main handlers
├── handlers/     # Specific feature handlers
└── utils/        # Configuration and messages
```
