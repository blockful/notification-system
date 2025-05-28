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

import { App } from './app';
import { setupDatabaseConnection } from './config/db.config';
import { loadConfig } from './config/env';

const config = loadConfig();

// Create database instances
const daosDb = setupDatabaseConnection('pg', config.anticaptureDataBaseUrl);
const usersDb = setupDatabaseConnection('pg', config.anticaptureDataBaseUrl);

// Create and start the application
const app = new App(
  daosDb,
  usersDb,
  config.telegramBotToken,
  config.subscriptionServerUrl,
  config.port
);

(async () => {
  await app.start();
})();