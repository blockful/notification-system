/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 * 
 */

import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  SUBSCRIPTION_SERVER_URL: z.string().url(),
  RABBITMQ_URL: z.string().url(),
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url(),
  BLOCKFUL_API_TOKEN: z.string().optional(),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);
  
  return {
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    rabbitmqUrl: env.RABBITMQ_URL,
    anticaptureGraphqlEndpoint: env.ANTICAPTURE_GRAPHQL_ENDPOINT,
    blockfulApiToken: env.BLOCKFUL_API_TOKEN,
  } as const;
} 