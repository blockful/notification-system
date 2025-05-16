/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  USERS_DATABASE_URL: z.string().min(1, "Users database URL is required"),
});

const env = envSchema.parse(process.env);

export const config = {
  telegramBotToken: env.TELEGRAM_BOT_TOKEN,
  databaseUrl: env.DATABASE_URL,
  usersDatabaseUrl: env.USERS_DATABASE_URL,
} as const; 