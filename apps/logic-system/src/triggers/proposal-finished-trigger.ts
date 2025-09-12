import { Trigger } from './base-trigger';
import { ProposalRepository } from '../repositories/proposal.repository';
import { RabbitMQDispatcherService } from '../api-clients/rabbitmq-dispatcher.service';
import { DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProposalOnChain, ProposalFinishedNotification } from '../interfaces/proposal.interface';

/**
 * Trigger for detecting finished proposals
 */
export class ProposalFinishedTrigger extends Trigger<ProposalOnChain, void> {
  private readonly finishedStatuses = ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED', 'QUEUED'];
  private lastProcessedEndTimestamp: string;

  constructor(
    private readonly proposalRepository: ProposalRepository,
    private readonly rabbitMQDispatcherService: RabbitMQDispatcherService,
    interval: number,
    initialTimestamp?: string
  ) {
    super('proposal-finished', interval);
    // Use provided timestamp or default to 24 hours lookback
    if (initialTimestamp) {
      this.lastProcessedEndTimestamp = initialTimestamp;
    } else {
      const twentyFourHoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      this.lastProcessedEndTimestamp = twentyFourHoursAgo.toString();
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
      this.lastProcessedEndTimestamp = timestamp;
    } else {
      const twentyFourHoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      this.lastProcessedEndTimestamp = twentyFourHoursAgo.toString();
    }
  }

  protected async fetchData(): Promise<ProposalOnChain[]> {
    return await this.proposalRepository.listAll({
      status: this.finishedStatuses,  // API accepts array
      fromDate: this.lastProcessedEndTimestamp,
      orderDirection: 'desc',  // API orders by timestamp by default
      limit: 100
    });
  }

  async process(data: ProposalOnChain[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const notifications: ProposalFinishedNotification[] = data.map(proposal => ({
      id: proposal?.id || '',
      daoId: proposal?.daoId || '',
      title: proposal?.title || undefined,
      description: proposal?.description || '',
      endTimestamp: proposal?.endTimestamp ? parseInt(proposal.endTimestamp) : 0,
      status: proposal?.status || 'unknown',
      forVotes: proposal?.forVotes || '0',
      againstVotes: proposal?.againstVotes || '0',
      abstainVotes: proposal?.abstainVotes || '0'
    }));

    // Send all proposals in a single batch message for maximum efficiency
    const message: DispatcherMessage<ProposalFinishedNotification> = {
      triggerId: this.id,
      events: notifications
    };
    
    await this.rabbitMQDispatcherService.sendMessage(message);
    
    // Update timestamp to the most recent proposal's endTimestamp
    // Since we order by endTimestamp desc, the first one has the highest endTimestamp
    if (notifications.length > 0 && notifications[0].endTimestamp > 0) {
      this.lastProcessedEndTimestamp = notifications[0].endTimestamp.toString();
    }
  }
}