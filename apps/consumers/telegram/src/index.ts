/**
 * Telegram Bot - Main Entry Point
 * 
 * This is the main entry point for the Telegram bot application.
 * It initializes the bot, sets up database connections, and registers commands.
 * 
 * The bot handles DAO tracking notifications for users and responds
 * to commands that allow users to customize their notification preferences.
 */

import { BotController } from './controllers/bot.controller';
import { DAOService } from './services/dao.service';
import { DatabaseService } from './repositories/db';
import { config } from './config/env';

// Initialize services and controllers
const dbService = new DatabaseService(config.databaseUrl, config.usersDatabaseUrl);
const daoService = new DAOService(dbService);
const botController = new BotController(config.telegramBotToken, daoService);

// Start the bot
botController.launch();

process.once('SIGINT', () => botController.stop('SIGINT'));
process.once('SIGTERM', () => botController.stop('SIGTERM'));