import dotenv from 'dotenv';
import { ProposalStatus } from '../interfaces/proposal.interface';
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
  DATABASE_URL: z.string(),
  API_URL: z.string(),
  TRIGGER_INTERVAL: z.coerce.number().optional().default(60000),
  PROPOSAL_STATUS: z.enum(validProposalStatuses)
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data; 