import { Trigger } from './base-trigger';
import { ProposalRepository } from '../repositories/proposal.repository';
import { RabbitMQDispatcherService } from '../api-clients/rabbitmq-dispatcher.service';
import { DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProposalOnChain, ProposalFinishedNotification } from '../interfaces/proposal.interface';
import { NotificationTypeId } from '@notification-system/messages';
import { QueryInput_Proposals_Status_Items } from '@notification-system/anticapture-client';

/**
 * Trigger for detecting finished proposals
 */
export class ProposalFinishedTrigger extends Trigger<ProposalOnChain, void> {
  private readonly finishedStatuses: QueryInput_Proposals_Status_Items[] = [
    QueryInput_Proposals_Status_Items.Executed,
    QueryInput_Proposals_Status_Items.Defeated,
    QueryInput_Proposals_Status_Items.Succeeded,
    QueryInput_Proposals_Status_Items.Expired,
    QueryInput_Proposals_Status_Items.Canceled,
  ];
  private endTimestampCursor: number;

  constructor(
    private readonly proposalRepository: ProposalRepository,
    private readonly rabbitMQDispatcherService: RabbitMQDispatcherService,
    interval: number,
    initialTimestamp?: string
  ) {
    super(NotificationTypeId.ProposalFinished, interval);
    // Use provided timestamp or default to 24 hours lookback
    if (initialTimestamp) {
      this.endTimestampCursor = parseInt(initialTimestamp, 10);
    } else {
      this.endTimestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
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
      this.endTimestampCursor = parseInt(timestamp, 10);
    } else {
      this.endTimestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
    }
  }

  protected async fetchData(): Promise<ProposalOnChain[]> {
    return await this.proposalRepository.listAll({
      status: this.finishedStatuses,  // API accepts array
      fromEndDate: this.endTimestampCursor,
      orderDirection: 'desc',  // API orders by endTimestamp when using fromEndDate
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
      ...(proposal?.title ? { title: proposal.title } : {}),
      description: proposal?.description || '',
      endTimestamp: Number(proposal?.endTimestamp) || 0,
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

    // Update timestamp to the most recent proposal's endTimestamp + 1
    // Since we order by endTimestamp desc, the first one has the highest endTimestamp
    if (notifications.length > 0 && notifications[0].endTimestamp > 0) {
      this.endTimestampCursor = notifications[0].endTimestamp + 1;
    }
  }
}