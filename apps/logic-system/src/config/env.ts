import dotenv from 'dotenv';
import { z } from 'zod';
import { onchainProposalStatusListEnum } from '@notification-system/anticapture-client';
import { DEFAULT_PROPOSAL_EXECUTABLE_OPTIONS } from '../triggers/proposal-executable-trigger';

// Load environment variables
dotenv.config();

// Define environment variables schema with validation
const envSchema = z.object({
  ANTICAPTURE_API_URL: z.string().url('ANTICAPTURE_API_URL must be a valid URL'),
  BLOCKFUL_API_TOKEN: z.string().optional(),
  RABBITMQ_URL: z.string().url(),
  TRIGGER_INTERVAL: z.coerce.number().optional().default(60000),
  PROPOSAL_STATUS: z.nativeEnum(onchainProposalStatusListEnum),
  PORT: z.coerce.number().positive().optional().default(3005),

  // ProposalExecutable trigger (webhook-only). Delay must match the configured DAOs' governor timelock.
  PROPOSAL_EXECUTABLE_DAOS: z.string().default(DEFAULT_PROPOSAL_EXECUTABLE_OPTIONS.daoIds.join(','))
    .transform(v => v.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))
    .refine(list => list.length > 0, { message: 'PROPOSAL_EXECUTABLE_DAOS must name at least one DAO' }),
  PROPOSAL_EXECUTABLE_TIMELOCK_DELAY_SECONDS: z.coerce.number().int().positive()
    .default(DEFAULT_PROPOSAL_EXECUTABLE_OPTIONS.timelockDelaySeconds),
  PROPOSAL_EXECUTABLE_MARGIN_SECONDS: z.coerce.number().int().nonnegative()
    .default(DEFAULT_PROPOSAL_EXECUTABLE_OPTIONS.marginSeconds),
  PROPOSAL_EXECUTABLE_LOOKBACK_DAYS: z.coerce.number().positive()
    .default(DEFAULT_PROPOSAL_EXECUTABLE_OPTIONS.lookbackDays),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`);
}

export const env = _env.data; 