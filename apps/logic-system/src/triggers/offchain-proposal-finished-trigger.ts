import { Trigger } from './base-trigger';
import { OffchainProposal, OffchainProposalDataSource } from '../interfaces/offchain-proposal.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { NotificationTypeId } from '@notification-system/messages';

const triggerId = NotificationTypeId.OffchainProposalFinished;

export class OffchainProposalFinishedTrigger extends Trigger<OffchainProposal, void> {
  private endTimestampCursor: number;

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly offchainProposalRepository: OffchainProposalDataSource,
    interval: number,
    initialTimestamp?: string
  ) {
    super(triggerId, interval);
    if (initialTimestamp) {
      this.endTimestampCursor = parseInt(initialTimestamp, 10);
    } else {
      this.endTimestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    }
  }

  /**
   * Resets the trigger state to initial timestamp
   * @param timestamp Optional timestamp to reset to, defaults to 24 hours ago
   * @todo This method will be removed when we migrate to Redis for state management
   */
  public reset(timestamp?: string): void {
    if (timestamp) {
      this.endTimestampCursor = parseInt(timestamp, 10);
    } else {
      this.endTimestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    }
  }

  protected async fetchData(): Promise<OffchainProposal[]> {
    return await this.offchainProposalRepository.listAll({
      status: ['closed'],
      endDate: this.endTimestampCursor,
      orderDirection: 'desc',
      limit: 100
    });
  }

  async process(data: OffchainProposal[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const message: DispatcherMessage = {
      triggerId: this.id,
      events: data
    };
    await this.dispatcherService.sendMessage(message);

    // Update cursor to the most recent end timestamp + 1
    const maxEnd = Math.max(...data.map(p => p.end));
    this.endTimestampCursor = maxEnd + 1;
  }
}
