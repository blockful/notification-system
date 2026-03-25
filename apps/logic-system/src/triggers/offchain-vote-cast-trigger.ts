import { Trigger } from './base-trigger';
import { OffchainVotesRepository } from '../repositories/offchain-votes.repository';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { OffchainVoteWithDaoId } from '@notification-system/anticapture-client';

export class OffchainVoteCastTrigger extends Trigger<OffchainVoteWithDaoId, void> {
  private lastProcessedTimestamp: number;

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly offchainVotesRepository: OffchainVotesRepository,
    interval: number
  ) {
    super('OffchainVoteCastTrigger', interval);
    this.lastProcessedTimestamp = Math.floor(Date.now() / 1000);
  }

  protected async fetchData(): Promise<OffchainVoteWithDaoId[]> {
    try {
      const votes = await this.offchainVotesRepository.listRecentOffchainVotes(this.lastProcessedTimestamp);
      console.log(`[OffchainVoteCastTrigger] Fetched ${votes.length} new offchain votes since timestamp ${this.lastProcessedTimestamp}`);
      return votes;
    } catch (error) {
      console.error('[OffchainVoteCastTrigger] Error fetching offchain votes:', error);
      return [];
    }
  }

  async process(data: OffchainVoteWithDaoId[]): Promise<void> {
    if (!data || data.length === 0) {
      return;
    }

    const message: DispatcherMessage<OffchainVoteWithDaoId> = {
      triggerId: 'offchain-vote-cast',
      events: data
    };

    await this.dispatcherService.sendMessage(message);
    console.log(`[OffchainVoteCastTrigger] Sent ${data.length} offchain votes to dispatcher`);

    const lastVote = data[data.length - 1];
    if (lastVote && lastVote.created) {
      this.lastProcessedTimestamp = lastVote.created + 1;
      console.log(`[OffchainVoteCastTrigger] Updated last processed timestamp to ${this.lastProcessedTimestamp}`);
    }
  }

  /**
   * Reset the trigger timestamp (useful for testing)
   * @param timestamp Optional timestamp to reset to, defaults to current time
   */
  public reset(timestamp?: string): void {
    this.lastProcessedTimestamp = timestamp ? parseInt(timestamp) : Math.floor(Date.now() / 1000);
    console.log(`[OffchainVoteCastTrigger] Reset timestamp to ${this.lastProcessedTimestamp}`);
  }

  /**
   * Get the current last processed timestamp (useful for monitoring/debugging)
   */
  public getLastProcessedTimestamp(): number {
    return this.lastProcessedTimestamp;
  }
}
