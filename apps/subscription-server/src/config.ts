import * as dotenv from 'dotenv';
import Knex, { Knex as KnexType } from 'knex';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/'),
  PORT: z.coerce.number().positive().default(3000),
  // Slack OAuth configuration
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_REDIRECT_URI: z.string(),
  // Token encryption for workspace credentials
  TOKEN_ENCRYPTION_KEY: z.string(),
});

export function loadConfig() {
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    console.error('Invalid environment variables:', env.error.format());
    process.exit(1);
  }

  const config = {
  databaseUrl: env.data.DATABASE_URL,
  port: env.data.PORT,
    slackClientId: env.data.SLACK_CLIENT_ID,
    slackClientSecret: env.data.SLACK_CLIENT_SECRET,
    slackRedirectUri: env.data.SLACK_REDIRECT_URI,
    tokenEncryptionKey: env.data.TOKEN_ENCRYPTION_KEY,
  }; 

  return config;
}