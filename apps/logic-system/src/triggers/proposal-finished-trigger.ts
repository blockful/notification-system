import { Trigger } from './base-trigger';
import { ProposalFinishedRepository } from '../repositories/proposal-finished.repository';
import { RabbitMQDispatcherService } from '../api-clients/rabbitmq-dispatcher.service';
import { DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProposalFinished, ProposalFinishedNotification } from '../interfaces/proposal.interface';

/**
 * Trigger for detecting finished proposals
 */
export class ProposalFinishedTrigger extends Trigger<ProposalFinished, void> {
  private lastNotifiedProposalTimestamp: number = 0;

  constructor(
    private readonly proposalFinishedRepository: ProposalFinishedRepository,
    private readonly rabbitMQDispatcherService: RabbitMQDispatcherService,
    interval: number
  ) {
    super('proposal-finished', interval);
  }

  protected async fetchData(): Promise<ProposalFinished[]> {
    return await this.proposalFinishedRepository.getFinishedProposalsSince(this.lastNotifiedProposalTimestamp);
  }

  async process(data: ProposalFinished[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    // Send all proposals in a single batch message for maximum efficiency
    const message: DispatcherMessage<ProposalFinishedNotification> = {
      triggerId: this.id,
      events: data as ProposalFinishedNotification[]
    };
    
    await this.rabbitMQDispatcherService.sendMessage(message);

    // Update last notified timestamp to the latest proposal's end timestamp
    this.lastNotifiedProposalTimestamp = Math.max(
      this.lastNotifiedProposalTimestamp,
      ...data.map(proposal => proposal.endTimestamp)
    );
  }
}