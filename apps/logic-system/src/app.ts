import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { DispatcherApiClient } from './api-clients/dispatcher.api-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import { Knex } from 'knex';

export class App {
  private trigger: NewProposalTrigger;
  private proposalStatus: ProposalStatus;

  constructor(db: Knex, dispatcherEndpoint: string, triggerInterval: number, proposalStatus: ProposalStatus) {
    this.proposalStatus = proposalStatus;
    
    const proposalDB = new ProposalRepository(db);
    const dispatcherService = new DispatcherApiClient(dispatcherEndpoint);

    this.trigger = new NewProposalTrigger(
      dispatcherService,
      proposalDB,
      triggerInterval
    );
  }

  start(): void {
    this.trigger.start({ status: this.proposalStatus });
    console.log('Logic system is running. Press Ctrl+C to stop.');
  }

  async stop(): Promise<void> {
    await this.trigger.stop();
  }
}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
}; 