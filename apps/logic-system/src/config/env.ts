import dotenv from 'dotenv';
import { z } from 'zod';
import { onchainProposalStatusListEnum } from '@notification-system/anticapture-client';

// Load environment variables
dotenv.config();

// Define environment variables schema with validation
const envSchema = z.object({
  ANTICAPTURE_API_URL: z.string().url('ANTICAPTURE_API_URL must be a valid URL'),
  BLOCKFUL_API_TOKEN: z.string().optional(),
  RABBITMQ_URL: z.string().url(),
  TRIGGER_INTERVAL: z.coerce.number().optional().default(60000),
  PROPOSAL_STATUS: z.nativeEnum(onchainProposalStatusListEnum),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`);
}

export const env = _env.data; 