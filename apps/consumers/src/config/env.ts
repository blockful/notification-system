/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  ANTICAPTURE_API_URL: z.string().url("ANTICAPTURE_API_URL must be a valid URL"),
  SUBSCRIPTION_SERVER_URL: z.string().min(1, "Subscription server URL is required"),
  API_PORT: z.coerce.number().default(3004),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);

  return {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    anticaptureApiUrl: env.ANTICAPTURE_API_URL,
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    port: env.API_PORT,
  } as const;
} 