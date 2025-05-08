import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { PostgresProposalDB } from './implementations/proposal-db';
import { HttpSubscriptionChecker } from './implementations/subscription-checker';
import { env } from './config/env';

// Create database and subscription checker implementations
const proposalDB = new PostgresProposalDB();
const subscriptionChecker = new HttpSubscriptionChecker(env.API_URL);

// Create and start the trigger
const trigger = new NewProposalTrigger(
  subscriptionChecker,
  proposalDB,
  env.TRIGGER_INTERVAL
);

// Start the trigger with the specified status
trigger.start({ status: env.PROPOSAL_STATUS });

async function shutdown() {
  console.log('Shutting down...');
  await trigger.stop();
  process.exit(0);
}

process.on('SIGINT', () => {
  console.log('Received SIGINT');
  shutdown();
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM');
  shutdown();
});

console.log('Logic system is running. Press Ctrl+C to stop.');

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};