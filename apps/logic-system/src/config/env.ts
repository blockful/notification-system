import dotenv from 'dotenv';
import { z } from 'zod';
import { QueryInput_Proposals_Status_Items } from '@notification-system/anticapture-client';

// Load environment variables
dotenv.config();

// Define valid proposal statuses
const validProposalStatuses = [
  'PENDING', 'ACTIVE', 'SUCCEEDED', 'DEFEATED', 
  'EXECUTED', 'CANCELED', 'QUEUED', 'EXPIRED'
] as const;

// Define environment variables schema with validation
const envSchema = z.object({
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url('ANTICAPTURE_GRAPHQL_ENDPOINT must be a valid URL'),
  BLOCKFUL_API_TOKEN: z.string().optional(),
  RABBITMQ_URL: z.string().url(),
  TRIGGER_INTERVAL: z.coerce.number().optional().default(60000),
  PROPOSAL_STATUS: z.enum(validProposalStatuses).transform(s => s as QueryInput_Proposals_Status_Items),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`);
}

export const env = _env.data; 