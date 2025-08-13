/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { ProposalOnChain, ListProposalsOptions, ProposalDataSource } from '../interfaces/proposal.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

const triggerId = 'new-proposal';

export class NewProposalTrigger extends Trigger<ProposalOnChain, ListProposalsOptions> {
  private lastFetchedTimestamp: string;
  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly proposalRepository: ProposalDataSource,
    interval: number
  ) {
    super(triggerId, interval);
    // Initialize with 1 hour lookback on startup
    const oneHourAgo = Math.floor((Date.now() - 3600000) / 1000);
    this.lastFetchedTimestamp = oneHourAgo.toString();
  }

  async process(data: ProposalOnChain[]) {
    if (data.length === 0) {
      return;
    }
    
    const message: DispatcherMessage = {
      triggerId: this.id,
      events: data
    };   
    await this.dispatcherService.sendMessage(message);
    
    // Update timestamp to the most recent proposal's timestamp
    // Since data comes ordered by timestamp desc, the first item has the latest timestamp
    if (data[0]?.timestamp) {
      this.lastFetchedTimestamp = data[0].timestamp;
    }
  }

  /**
   * Fetches proposals from the database
   * @returns Array of proposals
   */
  protected async fetchData(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    if (!options?.status) {
      throw new Error('Status is required in filter options');
    }
    return await this.proposalRepository.listAll({ 
      status: options.status,
      timestamp_gt: this.lastFetchedTimestamp 
    });
  }
} 