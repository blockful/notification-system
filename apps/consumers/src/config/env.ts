/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url("ANTICAPTURE_GRAPHQL_ENDPOINT must be a valid URL"),
  SUBSCRIPTION_SERVER_URL: z.string().min(1, "Subscription server URL is required"),
  API_PORT: z.coerce.number().default(3004),
  RABBITMQ_URL: z.string().url(),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);

  return {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    anticaptureGraphqlEndpoint: env.ANTICAPTURE_GRAPHQL_ENDPOINT,
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    port: env.API_PORT,
    rabbitmqUrl: env.RABBITMQ_URL,
  } as const;
} 