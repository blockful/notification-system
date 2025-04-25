import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { PostgresProposalDB } from './implementations/proposal-db';
import { HttpApiService } from './implementations/api-service';
import { loadEnvConfig } from './config/env';

// Load and validate environment variables
const config = loadEnvConfig();

// Create database and API service implementations
const proposalDB = new PostgresProposalDB(config.DATABASE_URL);
const apiService = new HttpApiService(config.API_URL);

// Create and start the trigger
const trigger = new NewProposalTrigger(
  apiService,
  proposalDB,
  config.TRIGGER_INTERVAL
);

// Start the trigger with the specified status
trigger.start({ status: config.PROPOSAL_STATUS });

// Set up graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  trigger.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  trigger.stop();
  process.exit(0);
});

console.log('Logic system is running. Press Ctrl+C to stop.');
