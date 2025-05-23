/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  ANTICAPTURE_DATABASE_URL: z.string().min(1, "Database URL is required"),
  SUBSCRIPTION_SERVER_URL: z.string().min(1, "Subscription server URL is required"),
  API_PORT: z.coerce.number().default(3004),
});

const env = envSchema.parse(process.env);

export const config = {
  telegramBotToken: env.TELEGRAM_BOT_TOKEN,
  anticaptureDataBaseUrl: env.ANTICAPTURE_DATABASE_URL,
  subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
  port: env.API_PORT,
} as const; 