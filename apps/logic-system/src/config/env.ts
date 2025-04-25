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
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required'
  }),
  API_URL: z.string({
    required_error: 'API_URL is required'
  }),
  TRIGGER_INTERVAL: z.string()
    .optional()
    .transform((val: string | undefined) => val ? parseInt(val, 10) : 60000),
  PROPOSAL_STATUS: z.enum(validProposalStatuses, {
    required_error: 'PROPOSAL_STATUS is required',
    invalid_type_error: `PROPOSAL_STATUS must be one of: ${validProposalStatuses.join(', ')}`
  })
});

// Parse and extract the environment variables schema type
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Loads and validates environment variables using Zod
 * @returns Object with validated environment variables
 */
export function loadEnvConfig(): EnvConfig {
  try {
    // Validate environment variables against the schema
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      // Print all validation errors
      console.error('Environment validation errors:');
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Failed to load environment variables:', error);
    }
    process.exit(1);
  }
} 