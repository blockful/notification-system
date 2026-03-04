/**
 * @fileoverview Trigger logic for handling voting power changes.
 * This module monitors for voting power changes and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { VotingPowerRepository } from '../repositories/voting-power.repository';
import { ThresholdRepository } from '../repositories/threshold.repository';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProcessedVotingPowerHistory, FeedEventType } from '@notification-system/anticapture-client';

const triggerId = 'voting-power-changed';

export class VotingPowerChangedTrigger extends Trigger<ProcessedVotingPowerHistory, void> {
  private lastProcessedTimestamp: string = Math.floor(Date.now() / 1000).toString();

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly votingPowerRepository: VotingPowerRepository,
    private readonly thresholdRepository: ThresholdRepository,
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

    // Always advance the timestamp cursor even if all events are filtered out,
    // to avoid reprocessing the same events on every cycle
    this.lastProcessedTimestamp = String(Number(data[data.length - 1].timestamp) + 1);

    const filtered = await this.filterByThreshold(data);
    if (filtered.length === 0) {
      return;
    }

    const message: DispatcherMessage<ProcessedVotingPowerHistory> = {
      triggerId: this.id,
      events: filtered
    };

    await this.dispatcherService.sendMessage(message);
  }

  private async filterByThreshold(
    data: ProcessedVotingPowerHistory[]
  ): Promise<ProcessedVotingPowerHistory[]> {
    const keep = await Promise.all(
      data.map(async (event) => {
        const type = event.changeType.toUpperCase();
        if (!Object.values(FeedEventType).includes(type as FeedEventType)) return true;

        const threshold = await this.thresholdRepository.getThreshold(event.daoId, type as FeedEventType);
        return threshold === null || Math.abs(Number(event.delta)) >= Number(threshold);
      })
    );

    return data.filter((_, i) => keep[i]);
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