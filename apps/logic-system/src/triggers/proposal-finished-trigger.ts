import { Trigger } from './base-trigger';
import { ProposalFinishedRepository } from '../repositories/proposal-finished.repository';
import { RabbitMQDispatcherService } from '../api-clients/rabbitmq-dispatcher.service';
import { DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProposalFinished, ProposalFinishedNotification } from '../interfaces/proposal.interface';

/**
 * Trigger for detecting finished proposals
 */
export class ProposalFinishedTrigger extends Trigger<ProposalFinished, void> {
  private lastNotifiedProposalTimestamp: number;

  constructor(
    private readonly proposalFinishedRepository: ProposalFinishedRepository,
    private readonly rabbitMQDispatcherService: RabbitMQDispatcherService,
    interval: number
  ) {
    super('proposal-finished', interval);
    // Initialize with 7-day lookback on startup
    this.lastNotifiedProposalTimestamp = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
  }

  protected async fetchData(): Promise<ProposalFinished[]> {
    return await this.proposalFinishedRepository.getFinishedProposalsSince(this.lastNotifiedProposalTimestamp);
  }

  async process(data: ProposalFinished[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const notifications: ProposalFinishedNotification[] = data.map(proposal => ({
      id: proposal.id,
      daoId: proposal.daoId,
      description: proposal.description,
      endTimestamp: proposal.endTimestamp
    }));

    // Send all proposals in a single batch message for maximum efficiency
    const message: DispatcherMessage<ProposalFinishedNotification> = {
      triggerId: this.id,
      events: notifications
    };
    
    await this.rabbitMQDispatcherService.sendMessage(message);

    // Update last notified timestamp to the latest proposal's timestamp (creation time)
    // this.lastNotifiedProposalTimestamp = Math.max(
    //   this.lastNotifiedProposalTimestamp,
    //   ...data.map(proposal => proposal.timestamp)
    // ); // TODO: Uncomment when API supports the endTimestamp field
    this.lastNotifiedProposalTimestamp = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
  }
}