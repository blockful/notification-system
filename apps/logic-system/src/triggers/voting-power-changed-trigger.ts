/**
 * @fileoverview Trigger logic for handling voting power changes.
 * This module monitors for voting power changes and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { VotingPowerHistoryOnChain, ListVotingPowerHistoryOptions, VotingPowerDataSource } from '../interfaces/voting-power.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

const triggerId = 'voting-power-changed';

export class VotingPowerChangedTrigger extends Trigger<VotingPowerHistoryOnChain, ListVotingPowerHistoryOptions> {
  private lastProcessedTimestamp: string = Date.now().toString();

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly votingPowerDB: VotingPowerDataSource,
    interval: number
  ) {
    super(triggerId, interval);
  }

  async process(data: VotingPowerHistoryOnChain[]) {
    if (data.length === 0) {
      return;
    }

    const message: DispatcherMessage<VotingPowerHistoryOnChain> = {
      triggerId: this.id,
      events: data
    };

    await this.dispatcherService.sendMessage(message);

    // Update the last processed timestamp to the most recent timestamp
    // Since data comes ordered by timestamp asc, the last item has the latest timestamp
    this.lastProcessedTimestamp = data[data.length - 1].timestamp;
  }

  /**
   * Fetches voting power history from the database with incremental processing
   * For now, uses ENS DAO as default. In future, should iterate through all DAOs.
   * @returns Array of voting power history records
   */
  protected async fetchData(options: ListVotingPowerHistoryOptions): Promise<VotingPowerHistoryOnChain[]> {
    options.timestamp_gt = this.lastProcessedTimestamp;
    return await this.votingPowerDB.listVotingPowerHistory(options);
  }
}