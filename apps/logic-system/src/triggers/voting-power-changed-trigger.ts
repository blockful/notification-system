/**
 * @fileoverview Trigger logic for handling voting power changes.
 * This module monitors for voting power changes and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { VotingPowerRepository } from '../repositories/voting-power.repository';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

const triggerId = 'voting-power-changed';

export class VotingPowerChangedTrigger extends Trigger<ProcessedVotingPowerHistory, void> {
  private lastProcessedTimestamp: string = Math.floor(Date.now() / 1000).toString();

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly votingPowerRepository: VotingPowerRepository,
    interval: number
  ) {
    super(triggerId, interval);
  }

  /**
   * Resets the trigger state to initial timestamp
   * @param timestamp Optional timestamp to reset to, defaults to current time
   * @todo This method will be removed when we migrate to Redis for state management,
   * allowing proper state isolation between tests without manual resets
   */
  public reset(timestamp?: string): void {
    if (timestamp) {
      this.lastProcessedTimestamp = timestamp;
    } else {
      this.lastProcessedTimestamp = Math.floor(Date.now() / 1000).toString();
    }
  }

  async process(data: ProcessedVotingPowerHistory[]) {
    if (data.length === 0) {
      return;
    }

    const message: DispatcherMessage<ProcessedVotingPowerHistory> = {
      triggerId: this.id,
      events: data
    };

    await this.dispatcherService.sendMessage(message);

    // Update the last processed timestamp to the most recent timestamp + 1 second
    // Since data comes ordered by timestamp asc, the last item has the latest timestamp
    // Adding 1 avoids reprocessing the same event since the API uses >= (gte) for fromDate
    this.lastProcessedTimestamp = String(Number(data[data.length - 1].timestamp) + 1);
  }

  /**
   * Fetches voting power history from the database with incremental processing
   * Queries all DAOs for voting power changes
   * @returns Array of voting power history records
   */
  protected async fetchData(): Promise<ProcessedVotingPowerHistory[]> {
    return await this.votingPowerRepository.listVotingPowerHistory(this.lastProcessedTimestamp);
  }
}