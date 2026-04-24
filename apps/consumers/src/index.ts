/**
 * Multi-Channel Bot - Main Entry Point
 *
 * This is the main entry point for the multi-channel bot application.
 * It initializes Telegram, Slack, and generic webhook consumers.
 *
 * The bot handles DAO tracking notifications for users across multiple
 * platforms (Telegram, Slack, and any registered webhook endpoint).
 */

import './instrumentation';

import axios from 'axios';
import { App } from './app';
import { createLogger, wrapWithTracing } from '@anticapture/observability';

const logger = createLogger('consumers');
import { loadConfig } from './config/env';
import { EnsResolverService } from './services/ens-resolver.service';
import { TelegramClient } from './clients/telegram.client';
import { SlackClient } from './clients/slack.client';

const config = loadConfig();

// Create ENS resolver
const ensResolver = wrapWithTracing(new EnsResolverService(config.rpcUrl));

// Create Telegram client for production
const telegramClient = wrapWithTracing(new TelegramClient(config.telegramBotToken));

// Create Slack client
const slackClient = wrapWithTracing(new SlackClient(
  config.slackSigningSecret,
  config.subscriptionServerUrl,
  config.tokenEncryptionKey,
  config.port
));

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
  config.webhookPort
);

(async () => {
  try {
    await app.start();
  } catch (err) {
    logger.error({ err }, 'consumers failed to start');
    process.exit(1);
  }
})();