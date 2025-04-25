import dotenv from 'dotenv';
import { ProposalStatus } from '../interfaces/repositories/proposal.interface';

export interface EnvConfig {
  DATABASE_URL: string;
  API_URL: string;
  TRIGGER_INTERVAL: number;
  PROPOSAL_STATUS: ProposalStatus;
}

/**
 * Loads and validates environment variables
 * @returns Object with validated environment variables
 */
export function loadEnvConfig(): EnvConfig {
  // Load environment variables
  dotenv.config();

  // Get environment variable values
  const {
    DATABASE_URL,
    API_URL,
    TRIGGER_INTERVAL,
    PROPOSAL_STATUS
  } = process.env;

  // Validate required variables
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  if (!API_URL) {
    console.error('API_URL is required');
    process.exit(1);
  }

  if (!PROPOSAL_STATUS) {
    console.error('PROPOSAL_STATUS is required');
    process.exit(1);
  }

  // Validate proposal status
  const validStatuses: ProposalStatus[] = [
    'pending', 'active', 'succeeded', 'defeated', 
    'executed', 'canceled', 'queued', 'expired'
  ];

  if (!validStatuses.includes(PROPOSAL_STATUS as ProposalStatus)) {
    console.error(`PROPOSAL_STATUS must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  // Convert interval to number or use default
  const interval = TRIGGER_INTERVAL ? parseInt(TRIGGER_INTERVAL, 10) : 60000;

  return {
    DATABASE_URL,
    API_URL,
    TRIGGER_INTERVAL: interval,
    PROPOSAL_STATUS: PROPOSAL_STATUS as ProposalStatus
  };
} 