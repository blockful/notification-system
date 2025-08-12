import { Trigger } from './base-trigger';
import { ProposalRepository } from '../repositories/proposal.repository';
import { RabbitMQDispatcherService } from '../api-clients/rabbitmq-dispatcher.service';
import { DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProposalOnChain, ProposalFinishedNotification } from '../interfaces/proposal.interface';

/**
 * Trigger for detecting finished proposals
 */
export class ProposalFinishedTrigger extends Trigger<ProposalOnChain, void> {
  private readonly finishedStatuses = ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'];

  constructor(
    private readonly proposalRepository: ProposalRepository,
    private readonly rabbitMQDispatcherService: RabbitMQDispatcherService,
    interval: number
  ) {
    super('proposal-finished', interval);
  }

  protected async fetchData(): Promise<ProposalOnChain[]> {
    return await this.proposalRepository.listAll({
      status_in: this.finishedStatuses,
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
      description: proposal?.description || '',
      // TODO: Use endTimestamp when available in API, using timestamp as fallback for now
      endTimestamp: proposal?.timestamp ? parseInt(proposal.timestamp) : 0,
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
  }
}