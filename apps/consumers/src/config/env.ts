/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  SLACK_APP_TOKEN: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  TOKEN_ENCRYPTION_KEY: z.string(),
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url("ANTICAPTURE_GRAPHQL_ENDPOINT must be a valid URL"),
  SUBSCRIPTION_SERVER_URL: z.string(),
  RABBITMQ_URL: z.string().url(),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);

  return {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    slackAppToken: env.SLACK_APP_TOKEN,
    slackSigningSecret: env.SLACK_SIGNING_SECRET,
    tokenEncryptionKey: env.TOKEN_ENCRYPTION_KEY,
    anticaptureGraphqlEndpoint: env.ANTICAPTURE_GRAPHQL_ENDPOINT,
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    rabbitmqUrl: env.RABBITMQ_URL,
  } as const;
} 