/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  SLACK_BOT_TOKEN: z.string().min(1, "Slack bot token is required"),
  SLACK_APP_TOKEN: z.string().min(1, "Slack app token is required for Socket Mode"),
  SLACK_SIGNING_SECRET: z.string().min(1, "Slack signing secret is required for request verification"),
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url("ANTICAPTURE_GRAPHQL_ENDPOINT must be a valid URL"),
  SUBSCRIPTION_SERVER_URL: z.string().min(1, "Subscription server URL is required"),
  RABBITMQ_URL: z.string().url(),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);

  return {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    slackBotToken: env.SLACK_BOT_TOKEN,
    slackAppToken: env.SLACK_APP_TOKEN,
    slackSigningSecret: env.SLACK_SIGNING_SECRET,
    anticaptureGraphqlEndpoint: env.ANTICAPTURE_GRAPHQL_ENDPOINT,
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    rabbitmqUrl: env.RABBITMQ_URL,
  } as const;
} 