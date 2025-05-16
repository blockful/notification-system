import { Telegraf } from 'telegraf'
import { setupCommands } from './controllers/bot-commands.controller';
import { DatabaseService } from './repositories/db';
import { config } from './config/env';

// Initialize database service
const dbService = new DatabaseService(config.databaseUrl, config.usersDatabaseUrl);

// Initialize the bot
const bot = new Telegraf(config.telegramBotToken);

// Set up commands
setupCommands(bot, dbService);

// Log when the bot is ready
console.log('🤖 Bot is running...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));