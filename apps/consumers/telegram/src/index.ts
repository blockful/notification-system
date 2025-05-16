/**
 * Telegram Bot - Main Entry Point
 * 
 * This is the main entry point for the Telegram bot application.
 * It initializes the bot, sets up database connections, and registers commands.
 * 
 * The bot handles DAO tracking notifications for users and responds
 * to commands that allow users to customize their notification preferences.
 * 
 * It also provides an API for receiving notifications from other services.
 */

import { Telegraf } from 'telegraf';
import { BotController } from './controllers/bot.controller';
import { DAOService } from './services/dao.service';
import { DatabaseService } from './repositories/db';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { NotificationService } from './services/notification.service';
import { startServer, startListening } from './server';
import { config } from './config/env';

// Initialize services
const dbService = new DatabaseService(config.anticaptureDataBaseUrl);
const subscriptionApi = new SubscriptionAPIService(config.subscriptionServerUrl);
const daoService = new DAOService(dbService, subscriptionApi);

const bot = new Telegraf(config.telegramBotToken);
const notificationService = new NotificationService(bot, subscriptionApi, dbService);
const botController = new BotController(config.telegramBotToken, daoService);

// Start the application
(async () => {
  const server = await startServer(notificationService);
  await startListening(server);
  botController.launch();
  console.log('🤖 Telegram bot and API server are now running!');
})();