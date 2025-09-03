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
import { EnsResolverService } from './services/ens-resolver.service';
import { RealTelegramClient } from './clients/real-telegram.client';

const config = loadConfig();

// Create ENS resolver
const ensResolver = new EnsResolverService();

// Create Telegram client for production
const telegramClient = new RealTelegramClient(config.telegramBotToken);

// Create and start the application
const app = new App(
  config.subscriptionServerUrl,
  axios.create({ baseURL: config.anticaptureGraphqlEndpoint }),
  config.rabbitmqUrl,
  ensResolver,
  telegramClient
);

(async () => {
  await app.start();
})();