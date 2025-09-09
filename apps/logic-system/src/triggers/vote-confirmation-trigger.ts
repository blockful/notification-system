import { Trigger } from './base-trigger';
import { VotesRepository, VoteEvent } from '../repositories/votes.repository';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

export class VoteConfirmationTrigger extends Trigger<VoteEvent, void> {
  private lastProcessedTimestamp: string;
  
  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly votesRepository: VotesRepository,
    interval: number
  ) {
    super('VoteConfirmationTrigger', interval);
    // Initialize with current timestamp
    this.lastProcessedTimestamp = Math.floor(Date.now() / 1000).toString();
  }

  protected async fetchData(): Promise<VoteEvent[]> {
    try {
      const votes = await this.votesRepository.listRecentVotes(this.lastProcessedTimestamp);
      console.log(`[VoteConfirmationTrigger] Fetched ${votes.length} new votes since timestamp ${this.lastProcessedTimestamp}`);
      return votes;
    } catch (error) {
      console.error('[VoteConfirmationTrigger] Error fetching votes:', error);
      return [];
    }
  }

  async process(data: VoteEvent[]): Promise<void> {
    if (!data || data.length === 0) {
      return;
    }
    // Group votes by DAO for efficient processing
    const votesByDao = data.reduce((acc, vote) => {
      if (!acc[vote.daoId]) {
        acc[vote.daoId] = [];
      }
      acc[vote.daoId].push(vote);
      return acc;
    }, {} as Record<string, VoteEvent[]>);

    // Send votes to dispatcher - flatten the grouped votes back into array
    const allVotes = Object.values(votesByDao).flat();
    const message: DispatcherMessage<VoteEvent> = {
      triggerId: 'vote-confirmation',
      events: allVotes
    };

    await this.dispatcherService.sendMessage(message);
    console.log(`[VoteConfirmationTrigger] Sent ${data.length} votes to dispatcher`);

    // Update timestamp to the last processed vote
    const lastVote = data[data.length - 1];
    if (lastVote && lastVote.timestamp) {
      // Add 1 second to avoid reprocessing the same vote
      this.lastProcessedTimestamp = (parseInt(lastVote.timestamp) + 1).toString();
      console.log(`[VoteConfirmationTrigger] Updated last processed timestamp to ${this.lastProcessedTimestamp}`);
    }
  }

  /**
   * Reset the trigger timestamp (useful for testing)
   * @param timestamp Optional timestamp to reset to, defaults to current time
   */
  public reset(timestamp?: string): void {
    this.lastProcessedTimestamp = timestamp || Math.floor(Date.now() / 1000).toString();
    console.log(`[VoteConfirmationTrigger] Reset timestamp to ${this.lastProcessedTimestamp}`);
  }

  /**
   * Get the current last processed timestamp (useful for monitoring/debugging)
   */
  public getLastProcessedTimestamp(): string {
    return this.lastProcessedTimestamp;
  }
}