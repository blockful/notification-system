import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { VotingPowerChangedTrigger } from './triggers/voting-power-changed-trigger';
import { ProposalFinishedTrigger } from './triggers/proposal-finished-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { VotingPowerRepository } from './repositories/voting-power.repository';
import { RabbitMQDispatcherService } from './api-clients/rabbitmq-dispatcher.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import { AxiosInstance } from 'axios';

export class App {
  private trigger!: NewProposalTrigger;
  private votingPowerTrigger!: VotingPowerChangedTrigger;
  private proposalFinishedTrigger!: ProposalFinishedTrigger;
  private proposalStatus: ProposalStatus;
  private rabbitMQConnection!: RabbitMQConnection;
  private rabbitMQPublisher!: RabbitMQPublisher;
  private initPromise: Promise<void>;

  constructor(
    triggerInterval: number, 
    proposalStatus: ProposalStatus,
    anticaptureHttpClient: AxiosInstance,
    rabbitmqUrl: string,
    initialTimestamp?: string
  ) {
    this.proposalStatus = proposalStatus;
    
    const anticaptureClient = new AnticaptureClient(anticaptureHttpClient);
    const proposalRepository = new ProposalRepository(anticaptureClient);
    const votingPowerRepository = new VotingPowerRepository(anticaptureClient);

    this.initPromise = this.initializeRabbitMQ(rabbitmqUrl, proposalRepository, votingPowerRepository, triggerInterval, initialTimestamp);
  }

  private async initializeRabbitMQ(
    rabbitmqUrl: string, 
    proposalRepository: ProposalRepository,
    votingPowerRepository: VotingPowerRepository,
    triggerInterval: number,
    initialTimestamp?: string
  ): Promise<void> {
    this.rabbitMQConnection = new RabbitMQConnection(rabbitmqUrl);
    await this.rabbitMQConnection.connect();
    
    this.rabbitMQPublisher = await RabbitMQPublisher.create(this.rabbitMQConnection);
    const dispatcherService = new RabbitMQDispatcherService(this.rabbitMQPublisher);

    this.trigger = new NewProposalTrigger(
      dispatcherService,
      proposalRepository,
      triggerInterval,
      initialTimestamp
    );

    this.votingPowerTrigger = new VotingPowerChangedTrigger(
      dispatcherService,
      votingPowerRepository,
      triggerInterval
    );

    this.proposalFinishedTrigger = new ProposalFinishedTrigger(
      proposalRepository,
      dispatcherService,
      triggerInterval,
      initialTimestamp
    );
  }

  async start(): Promise<void> {
    await this.initPromise;
    this.trigger.start({ status: this.proposalStatus });
    this.votingPowerTrigger.start();
    this.proposalFinishedTrigger.start();
    console.log('Logic system is running. Press Ctrl+C to stop.');
  }

  /**
   * Resets all triggers to their initial state
   * @param initialTimestamp Optional timestamp to reset to
   * @todo This method will be removed when we migrate to Redis for state management,
   * allowing proper state isolation between tests without manual resets
   */
  public resetTriggers(initialTimestamp?: string): void {
    if (this.trigger) {
      this.trigger.reset(initialTimestamp);
    }
    if (this.votingPowerTrigger) {
      this.votingPowerTrigger.reset(initialTimestamp);
    }
    if (this.proposalFinishedTrigger) {
      this.proposalFinishedTrigger.reset(initialTimestamp);
    }
  }

  async stop(): Promise<void> {
    await this.trigger.stop();
    await this.votingPowerTrigger.stop();
    await this.proposalFinishedTrigger.stop();
    if (this.rabbitMQPublisher) {
      await this.rabbitMQPublisher.close();
    }
    if (this.rabbitMQConnection) {
      await this.rabbitMQConnection.close();
    }
  }
}

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};
