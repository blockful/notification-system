import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { DispatcherApiClient } from './api-clients/dispatcher.api-client';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import axios, { AxiosInstance } from 'axios';

export class App {
  private trigger: NewProposalTrigger;
  private proposalStatus: ProposalStatus;

  constructor(
    triggerInterval: number, 
    proposalStatus: ProposalStatus,
    anticaptureHttpClient: AxiosInstance,
    dispatcherHttpClient: AxiosInstance
  ) {
    this.proposalStatus = proposalStatus;
    
    const anticaptureClient = new AnticaptureClient(anticaptureHttpClient);
    const proposalDB = new ProposalRepository(anticaptureClient);
    const dispatcherService = new DispatcherApiClient(dispatcherHttpClient);

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
