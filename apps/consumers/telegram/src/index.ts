/**
 * Telegram Bot - Main Entry Point
 * 
 * This is the main entry point for the Telegram bot application.
 * It initializes the bot, sets up database connections, and registers commands.
 * 
 * The bot handles DAO tracking notifications for users and responds
 * to commands that allow users to customize their notification preferences.
 */

import { Telegraf } from 'telegraf'
import { setupCommands } from './controllers/bot-commands.controller';
import { DatabaseService } from './repositories/db';
import { config } from './config/env';

const dbService = new DatabaseService(config.databaseUrl, config.usersDatabaseUrl);
const bot = new Telegraf(config.telegramBotToken);
setupCommands(bot, dbService);
console.log('🤖 Bot is running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));