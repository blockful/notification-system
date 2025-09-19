/**
 * Multi-Channel Bot - Main Entry Point
 *
 * This is the main entry point for the multi-channel bot application.
 * It initializes both Telegram and Slack bots based on available tokens.
 *
 * The bot handles DAO tracking notifications for users across multiple
 * platforms (Telegram and Slack) and responds to commands that allow
 * users to customize their notification preferences.
 */

import axios from 'axios';
import { App } from './app';
import { loadConfig } from './config/env';
import { EnsResolverService } from './services/ens-resolver.service';
import { TelegramClient } from './clients/telegram.client';
import { SlackClient } from './clients/slack.client';

const config = loadConfig();

// Create ENS resolver
const ensResolver = new EnsResolverService();

// Create Telegram client for production
const telegramClient = new TelegramClient(config.telegramBotToken);

// Create Slack client 
const slackClient = new SlackClient(
  config.slackBotToken,
  config.slackAppToken,
  config.slackSigningSecret
);

// Create and start the application
const app = new App(
  config.subscriptionServerUrl,
  axios.create({ baseURL: config.anticaptureGraphqlEndpoint }),
  config.rabbitmqUrl,
  ensResolver,
  telegramClient,
  slackClient
);

(async () => {
  await app.start();
})();