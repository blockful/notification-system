#!/usr/bin/env node

import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { DispatcherApiClient } from './api-clients/dispatcher.api-client';
import { env } from './config/env';
import { db } from './config/database';

// Create database and dispatcher service implementations
const proposalDB = new ProposalRepository(db);
const dispatcherService = new DispatcherApiClient(env.DISPATCHER_ENDPOINT);

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