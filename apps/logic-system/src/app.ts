import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { VotingPowerChangedTrigger } from './triggers/voting-power-changed-trigger';
import { ProposalFinishedTrigger } from './triggers/proposal-finished-trigger';
import { VoteConfirmationTrigger } from './triggers/vote-confirmation-trigger';
import { VotingReminderTrigger } from './triggers/voting-reminder-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { VotingPowerRepository } from './repositories/voting-power.repository';
import { VotesRepository } from './repositories/votes.repository';
import { RabbitMQDispatcherService } from './api-clients/rabbitmq-dispatcher.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { ProposalStatus } from './interfaces/proposal.interface';
import { AxiosInstance } from 'axios';

export class App {
  private trigger!: NewProposalTrigger;
  private votingPowerTrigger!: VotingPowerChangedTrigger;
  private proposalFinishedTrigger!: ProposalFinishedTrigger;
  private voteConfirmationTrigger!: VoteConfirmationTrigger;
  private votingReminderTrigger30!: VotingReminderTrigger;
  private votingReminderTrigger60!: VotingReminderTrigger;
  private votingReminderTrigger90!: VotingReminderTrigger;
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
    const votesRepository = new VotesRepository(anticaptureClient);

    this.initPromise = this.initializeRabbitMQ(rabbitmqUrl, proposalRepository, votingPowerRepository, votesRepository, triggerInterval, initialTimestamp);
  }

  private async initializeRabbitMQ(
    rabbitmqUrl: string, 
    proposalRepository: ProposalRepository,
    votingPowerRepository: VotingPowerRepository,
    votesRepository: VotesRepository,
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

    this.voteConfirmationTrigger = new VoteConfirmationTrigger(
      dispatcherService,
      votesRepository,
      triggerInterval
    );

    // Initialize voting reminder triggers with different thresholds
    // Use the same interval as other triggers for consistency (especially important for tests)
    this.votingReminderTrigger30 = new VotingReminderTrigger(
      dispatcherService,
      proposalRepository,
      triggerInterval,
      30, // 30% threshold
    );

    this.votingReminderTrigger60 = new VotingReminderTrigger(
      dispatcherService,
      proposalRepository,
      triggerInterval,
      60, // 60% threshold
    );

    this.votingReminderTrigger90 = new VotingReminderTrigger(
      dispatcherService,
      proposalRepository,
      triggerInterval,
      90, // 90% threshold
    );
  }

  async start(): Promise<void> {
    await this.initPromise;
    this.trigger.start({ status: this.proposalStatus });
    this.votingPowerTrigger.start();
    this.proposalFinishedTrigger.start();
    this.voteConfirmationTrigger.start();
    
    // Start voting reminder triggers with their respective configurations
    this.votingReminderTrigger30.start({ thresholdPercentage: 30});
    this.votingReminderTrigger60.start({ thresholdPercentage: 60 });
    this.votingReminderTrigger90.start({ thresholdPercentage: 90 });
    
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
    if (this.voteConfirmationTrigger) {
      this.voteConfirmationTrigger.reset(initialTimestamp);
    }
    if (this.votingReminderTrigger30) {
      this.votingReminderTrigger30.reset(initialTimestamp);
    }
    if (this.votingReminderTrigger60) {
      this.votingReminderTrigger60.reset(initialTimestamp);
    }
    if (this.votingReminderTrigger90) {
      this.votingReminderTrigger90.reset(initialTimestamp);
    }
  }

  async stop(): Promise<void> {
    await this.trigger.stop();
    await this.votingPowerTrigger.stop();
    await this.proposalFinishedTrigger.stop();
    await this.voteConfirmationTrigger.stop();
    await this.votingReminderTrigger30.stop();
    await this.votingReminderTrigger60.stop();
    await this.votingReminderTrigger90.stop();
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
