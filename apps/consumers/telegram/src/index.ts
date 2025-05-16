import { Telegraf } from 'telegraf'
import { setupCommands } from './commands/commands';
import { DatabaseService } from './db';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  databaseUrl: process.env.DATABASE_URL || '',
  usersDatabaseUrl: process.env.USERS_DATABASE_URL || ''
};

if (!config.botToken) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

if (!config.databaseUrl || !config.usersDatabaseUrl) {
  console.error('Error: Database URLs are not defined in .env file');
  process.exit(1);
}

// Initialize database service
const dbService = new DatabaseService(config.databaseUrl, config.usersDatabaseUrl);

// Initialize the bot
const bot = new Telegraf(config.botToken);

// Set up commands
setupCommands(bot, dbService);

// Log when the bot is ready
console.log('🤖 Bot is running...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));