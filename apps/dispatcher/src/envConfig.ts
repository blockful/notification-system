/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 * 
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
});

const env = envSchema.parse(process.env);

export const config = {
  environment: env.NODE_ENV,
  port: env.PORT,
} as const; 