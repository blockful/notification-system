/**
 * Environment configuration module that validates and provides type-safe access to environment variables.
 * Uses Zod for runtime type checking and validation of environment variables.
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  TOKEN_ENCRYPTION_KEY: z.string(),
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url("ANTICAPTURE_GRAPHQL_ENDPOINT must be a valid URL"),
  BLOCKFUL_API_TOKEN: z.string().optional(),
  SUBSCRIPTION_SERVER_URL: z.string(),
  RABBITMQ_URL: z.string().url(),
  PORT: z.coerce.number().positive().optional().default(3002),
  WEBHOOK_API_PORT: z.coerce.number().positive().default(3003),
  RPC_URL: z.string().optional(),
});

export function loadConfig() {
  dotenv.config();
  const env = envSchema.parse(process.env);

  return {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    slackSigningSecret: env.SLACK_SIGNING_SECRET,
    tokenEncryptionKey: env.TOKEN_ENCRYPTION_KEY,
    anticaptureGraphqlEndpoint: env.ANTICAPTURE_GRAPHQL_ENDPOINT,
    blockfulApiToken: env.BLOCKFUL_API_TOKEN,
    subscriptionServerUrl: env.SUBSCRIPTION_SERVER_URL,
    rabbitmqUrl: env.RABBITMQ_URL,
    port: env.PORT,
    webhookPort: env.WEBHOOK_API_PORT,
    rpcUrl: env.RPC_URL,
  } as const;
} 