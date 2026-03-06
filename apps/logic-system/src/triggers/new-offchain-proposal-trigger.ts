/**
 * @fileoverview Trigger logic for handling new offchain (Snapshot) proposals.
 * Monitors for active/pending Snapshot proposals and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { OffchainProposal, OffchainProposalDataSource, ListOffchainProposalsOptions } from '../interfaces/offchain-proposal.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

const triggerId = 'new-offchain-proposal';

export class NewOffchainProposalTrigger extends Trigger<OffchainProposal, ListOffchainProposalsOptions> {
  private timestampCursor: number;

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly offchainProposalRepository: OffchainProposalDataSource,
    interval: number,
    initialTimestamp?: string
  ) {
    super(triggerId, interval);
    if (initialTimestamp) {
      this.timestampCursor = parseInt(initialTimestamp, 10);
    } else {
      this.timestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
    }
  }

  /**
   * Resets the trigger state to initial timestamp
   * @param timestamp Optional timestamp to reset to, defaults to 24 hours ago
   * @todo This method will be removed when we migrate to Redis for state management
   */
  public reset(timestamp?: string): void {
    if (timestamp) {
      this.timestampCursor = parseInt(timestamp, 10);
    } else {
      this.timestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    }
  }

  async process(data: OffchainProposal[]) {
    if (data.length === 0) {
      return;
    }

    const message: DispatcherMessage = {
      triggerId: this.id,
      events: data
    };
    await this.dispatcherService.sendMessage(message);

    // Update cursor to the most recent proposal's created timestamp + 1
    // Data comes sorted by created desc, so the first item has the latest timestamp
    if (data[0]?.created) {
      this.timestampCursor = data[0].created + 1;
    }
  }

  /**
   * Fetches offchain proposals from the API
   * @returns Array of offchain proposals
   */
  protected async fetchData(options: ListOffchainProposalsOptions): Promise<OffchainProposal[]> {
    return await this.offchainProposalRepository.listAll({
      ...options,
      status: options.status,
      fromDate: this.timestampCursor
    });
  }
}
