/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 * 
 */

import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  SUBSCRIPTION_SERVER_URL: z.string().url(),
  TELEGRAM_CONSUMER_URL: z.string().url(),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);
  
  return {
    environment: env.NODE_ENV,
    port: env.PORT,
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    telegramConsumerUrl: env.TELEGRAM_CONSUMER_URL,
  } as const;
} 