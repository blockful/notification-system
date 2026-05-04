import { Trigger } from './base-trigger';
import { OffchainVotesRepository } from '../repositories/offchain-votes.repository';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { OffchainVoteWithDaoId } from '@notification-system/anticapture-client';
import { NotificationTypeId } from '@notification-system/messages';
import { createLogger, type Logger } from '@anticapture/observability';

export class OffchainVoteCastTrigger extends Trigger<OffchainVoteWithDaoId, void> {
  private lastProcessedTimestamp: number;

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly offchainVotesRepository: OffchainVotesRepository,
    interval: number,
    logger: Logger = createLogger('logic-system'),
  ) {
    super('OffchainVoteCastTrigger', interval, logger);
    this.lastProcessedTimestamp = Math.floor(Date.now() / 1000);
  }

  protected async fetchData(): Promise<OffchainVoteWithDaoId[]> {
    try {
      const votes = await this.offchainVotesRepository.listRecentOffchainVotes(this.lastProcessedTimestamp);
      this.logger.info(
        { count: votes.length, sinceTimestamp: this.lastProcessedTimestamp, event: 'offchain_votes.fetched' },
        'fetched new offchain votes',
      );
      return votes;
    } catch (error) {
      this.logger.error(
        { err: error, event: 'offchain_votes.fetch_failed' },
        'error fetching offchain votes',
      );
      return [];
    }
  }

  async process(data: OffchainVoteWithDaoId[]): Promise<void> {
    if (!data || data.length === 0) {
      return;
    }

    const message: DispatcherMessage<OffchainVoteWithDaoId> = {
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: data
    };

    await this.dispatcherService.sendMessage(message);
    this.logger.info(
      { count: data.length, event: 'offchain_votes.dispatched' },
      'sent offchain votes to dispatcher',
    );

    const lastVote = data[data.length - 1];
    if (lastVote && lastVote.created) {
      this.lastProcessedTimestamp = lastVote.created + 1;
      this.logger.debug(
        { lastProcessedTimestamp: this.lastProcessedTimestamp, event: 'cursor.advanced' },
        'updated last processed timestamp',
      );
    }
  }

  /**
   * Reset the trigger timestamp (useful for testing)
   * @param timestamp Optional timestamp to reset to, defaults to current time
   */
  public reset(timestamp?: string): void {
    this.lastProcessedTimestamp = timestamp ? parseInt(timestamp) : Math.floor(Date.now() / 1000);
    this.logger.info(
      { lastProcessedTimestamp: this.lastProcessedTimestamp, event: 'cursor.reset' },
      'reset timestamp',
    );
  }

  /**
   * Get the current last processed timestamp (useful for monitoring/debugging)
   */
  public getLastProcessedTimestamp(): number {
    return this.lastProcessedTimestamp;
  }
}
