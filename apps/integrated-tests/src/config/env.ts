/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  // RabbitMQ configuration
  TEST_RABBITMQ_URL: z.string().url().optional(),
  
  // Telegram configuration
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required").optional(),
  SEND_REAL_TELEGRAM: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`);
}

export const env = _env.data; 