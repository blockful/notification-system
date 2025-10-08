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
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  SEND_REAL_TELEGRAM: z.coerce.boolean().default(false),

  // Slack configuration
  SEND_REAL_SLACK: z.coerce.boolean().default(false),
  SLACK_TEST_CHANNEL_ID: z.string().optional(), 
  SLACK_WORKSPACE_ID: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_TEST_USER_ID: z.string().optional(),

  // Encryption key for OAuth tokens
  TOKEN_ENCRYPTION_KEY: z.string().default('e10981ff87b7483d85cdbf8b1ae0618236a37afe8cc082853183b6283c470e22')
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`);
}

// Validate required credentials when real mode is enabled
if (_env.data.SEND_REAL_TELEGRAM && !_env.data.TELEGRAM_BOT_TOKEN) {
  throw new Error(
    'SEND_REAL_TELEGRAM is enabled but missing TELEGRAM_BOT_TOKEN'
  );
}

if (_env.data.SEND_REAL_SLACK) {
  if (!_env.data.SLACK_WORKSPACE_ID || !_env.data.SLACK_BOT_TOKEN || !_env.data.SLACK_TEST_CHANNEL_ID) {
    throw new Error(
      'SEND_REAL_SLACK is enabled but missing required Slack credentials. ' +
      'Please provide SLACK_WORKSPACE_ID, SLACK_BOT_TOKEN, and SLACK_TEST_CHANNEL_ID'
    );
  }
}

export const env = _env.data; 