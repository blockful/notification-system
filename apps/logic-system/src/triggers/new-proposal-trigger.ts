/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { ProposalWithDAO, ListProposalsOptions, ProposalDB } from '../interfaces/proposal.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

const triggerId = 'new-proposal';

export class NewProposalTrigger extends Trigger<ProposalWithDAO, ListProposalsOptions> {
  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly proposalDB: ProposalDB,
    interval: number
  ) {
    super(triggerId, interval);
  }

  async process(data: ProposalWithDAO[]) {
    const message: DispatcherMessage = {
      triggerId: this.id,
      events: data
    };   
    await this.dispatcherService.sendMessage(message);
  }

  /**
   * Fetches proposals from the database
   * @returns Array of proposals
   */
  protected async fetchData(options?: ListProposalsOptions): Promise<ProposalWithDAO[]> {
    if (!options?.status) {
      throw new Error('Status is required in filter options');
    }
    return await this.proposalDB.listAll({ status: options.status });
  }
} 