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
import { OpenClawClient } from './clients/openclaw.client';

const config = loadConfig();

// Create ENS resolver
const ensResolver = new EnsResolverService(config.rpcUrl);

// Create Telegram client for production
const telegramClient = new TelegramClient(config.telegramBotToken);

// Create Slack client
const slackClient = new SlackClient(
  config.slackSigningSecret,
  config.subscriptionServerUrl,
  config.tokenEncryptionKey,
  config.port
);

// Create OpenClaw client (optional — only if webhook URL is configured)
const openclawClient = config.openclawWebhookUrl
  ? new OpenClawClient(config.openclawWebhookUrl, config.openclawApiKey)
  : undefined;

if (openclawClient) {
  console.log('🦞 OpenClaw client configured');
} else {
  console.log('⚠️  OpenClaw webhook not configured — consumer will run in noop mode');
}

// Create and start the application
const app = new App(
  config.subscriptionServerUrl,
  axios.create({
    baseURL: config.anticaptureGraphqlEndpoint,
    headers: {
      ...(config.blockfulApiToken && {
        Authorization: `Bearer ${config.blockfulApiToken}`,
      }),
    },
  }),
  config.rabbitmqUrl,
  ensResolver,
  telegramClient,
  slackClient,
  openclawClient
);

(async () => {
  await app.start();
})();