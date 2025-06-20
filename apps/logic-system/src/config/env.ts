import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define valid proposal statuses
const validProposalStatuses = [
  'pending', 'active', 'succeeded', 'defeated', 
  'executed', 'canceled', 'queued', 'expired'
] as const;

// Define environment variables schema with validation
const envSchema = z.object({
  ANTICAPTURE_GRAPHQL_ENDPOINT: z.string().url('ANTICAPTURE_GRAPHQL_ENDPOINT must be a valid URL'),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  TRIGGER_INTERVAL: z.coerce.number().optional().default(60000),
  PROPOSAL_STATUS: z.enum(validProposalStatuses),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`);
}

export const env = _env.data; 