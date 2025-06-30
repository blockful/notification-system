/**
 * Telegram Bot - Main Entry Point
 * 
 * This is the main entry point for the Telegram bot application.
 * It initializes the bot and registers commands.
 * 
 * The bot handles DAO tracking notifications for users and responds
 * to commands that allow users to customize their notification preferences.
 * 
 * It also provides an API for receiving notifications from other services.
 */

import axios from 'axios';
import { App } from './app';
import { loadConfig } from './config/env';

const config = loadConfig();

// Create and start the application
const app = new App(
  config.telegramBotToken,
  config.subscriptionServerUrl,
  axios.create({ baseURL: config.anticaptureGraphqlEndpoint }),
  config.rabbitmqUrl
);

(async () => {
  await app.start();
})();