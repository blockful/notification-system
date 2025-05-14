import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { PostgresProposalDB } from './implementations/proposal-db';
import { DispatcherServiceImpl } from './implementations/dispatcher.service';
import { env } from './config/env';
import { db } from './config/database';

// Create database and dispatcher service implementations
const proposalDB = new PostgresProposalDB(db);
const dispatcherService = new DispatcherServiceImpl(env.DISPATCHER_ENDPOINT);

// Create and start the trigger
const trigger = new NewProposalTrigger(
  dispatcherService,
  proposalDB,
  env.TRIGGER_INTERVAL
);
trigger.start({ status: env.PROPOSAL_STATUS });
console.log('Logic system is running. Press Ctrl+C to stop.');

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};