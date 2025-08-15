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
    interval: number,
    initialTimestamp?: string
  ) {
    super(triggerId, interval);
    // Use provided timestamp or default to 24 hours lookback
    if (initialTimestamp) {
      this.lastFetchedTimestamp = initialTimestamp;
    } else {
      const twentyFourHoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      this.lastFetchedTimestamp = twentyFourHoursAgo.toString();
    }
  }

  /**
   * Resets the trigger state to initial timestamp
   * @param timestamp Optional timestamp to reset to, defaults to 24 hours ago
   * @todo This method will be removed when we migrate to Redis for state management,
   * allowing proper state isolation between tests without manual resets
   */
  public reset(timestamp?: string): void {
    if (timestamp) {
      this.lastFetchedTimestamp = timestamp;
    } else {
      const twentyFourHoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      this.lastFetchedTimestamp = twentyFourHoursAgo.toString();
    }
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
      fromDate: this.lastFetchedTimestamp 
    });
  }
} 