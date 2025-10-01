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
  const env = envSchema.parse(process.env);

  const config = {
  databaseUrl: env.DATABASE_URL,
  port: env.PORT,
    slackClientId: env.SLACK_CLIENT_ID,
    slackClientSecret: env.SLACK_CLIENT_SECRET,
    slackRedirectUri: env.SLACK_REDIRECT_URI,
    tokenEncryptionKey: env.TOKEN_ENCRYPTION_KEY,
  }; 

  return config;
}