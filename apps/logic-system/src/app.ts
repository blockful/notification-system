import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { NewOffchainProposalTrigger } from './triggers/new-offchain-proposal-trigger';
import { OffchainProposalFinishedTrigger } from './triggers/offchain-proposal-finished-trigger';
import { VotingPowerChangedTrigger } from './triggers/voting-power-changed-trigger';
import { ProposalFinishedTrigger } from './triggers/proposal-finished-trigger';
import { VoteConfirmationTrigger } from './triggers/vote-confirmation-trigger';
import { OffchainVoteCastTrigger } from './triggers/offchain-vote-cast-trigger';
import { VotingReminderTrigger } from './triggers/voting-reminder-trigger';
import { ProposalRepository } from './repositories/proposal.repository';
import { OffchainProposalRepository } from './repositories/offchain-proposal.repository';
import { VotingPowerRepository } from './repositories/voting-power.repository';
import { ThresholdRepository } from './repositories/threshold.repository';
import { VotesRepository } from './repositories/votes.repository';
import { OffchainVotesRepository } from './repositories/offchain-votes.repository';
import { RabbitMQDispatcherService } from './api-clients/rabbitmq-dispatcher.service';
import { AnticaptureClient, QueryInput_Proposals_Status_Items } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { AxiosInstance } from 'axios';

export class App {
  private trigger!: NewProposalTrigger;
  private offchainProposalTrigger!: NewOffchainProposalTrigger;
  private offchainProposalFinishedTrigger!: OffchainProposalFinishedTrigger;
  private votingPowerTrigger!: VotingPowerChangedTrigger;
  private proposalFinishedTrigger!: ProposalFinishedTrigger;
  private voteConfirmationTrigger!: VoteConfirmationTrigger;
  private offchainVoteCastTrigger!: OffchainVoteCastTrigger;
  private votingReminderTrigger30!: VotingReminderTrigger;
  private votingReminderTrigger60!: VotingReminderTrigger;
  private votingReminderTrigger90!: VotingReminderTrigger;
  private offchainVotingReminderTrigger75!: VotingReminderTrigger;
  private proposalStatus: QueryInput_Proposals_Status_Items;
  private rabbitMQConnection!: RabbitMQConnection;
  private rabbitMQPublisher!: RabbitMQPublisher;
  private initPromise: Promise<void>;

  constructor(
    triggerInterval: number,
    proposalStatus: QueryInput_Proposals_Status_Items,
    anticaptureHttpClient: AxiosInstance,
    rabbitmqUrl: string,
    initialTimestamp?: string
  ) {
    this.proposalStatus = proposalStatus;
    
    const anticaptureClient = new AnticaptureClient(anticaptureHttpClient);
    const proposalRepository = new ProposalRepository(anticaptureClient);
    const offchainProposalRepository = new OffchainProposalRepository(anticaptureClient);
    const votingPowerRepository = new VotingPowerRepository(anticaptureClient);
    const thresholdRepository = new ThresholdRepository(anticaptureClient);
    const votesRepository = new VotesRepository(anticaptureClient);
    const offchainVotesRepository = new OffchainVotesRepository(anticaptureClient);

    this.initPromise = this.initializeRabbitMQ(rabbitmqUrl, proposalRepository, offchainProposalRepository, votingPowerRepository, thresholdRepository, votesRepository, offchainVotesRepository, triggerInterval, initialTimestamp);
  }

  private async initializeRabbitMQ(
    rabbitmqUrl: string,
    proposalRepository: ProposalRepository,
    offchainProposalRepository: OffchainProposalRepository,
    votingPowerRepository: VotingPowerRepository,
    thresholdRepository: ThresholdRepository,
    votesRepository: VotesRepository,
    offchainVotesRepository: OffchainVotesRepository,
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

    this.offchainProposalTrigger = new NewOffchainProposalTrigger(
      dispatcherService,
      offchainProposalRepository,
      triggerInterval,
      initialTimestamp
    );

    this.votingPowerTrigger = new VotingPowerChangedTrigger(
      dispatcherService,
      votingPowerRepository,
      thresholdRepository,
      triggerInterval
    );

    this.offchainProposalFinishedTrigger = new OffchainProposalFinishedTrigger(
      dispatcherService,
      offchainProposalRepository,
      triggerInterval,
      initialTimestamp
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

    this.offchainVoteCastTrigger = new OffchainVoteCastTrigger(
      dispatcherService,
      offchainVotesRepository,
      triggerInterval
    );

    // Initialize voting reminder triggers with different thresholds
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

    this.offchainVotingReminderTrigger75 = new VotingReminderTrigger(
      dispatcherService,
      offchainProposalRepository,
      triggerInterval,
      75, // 75% threshold
      5,  // default window size
      'offchain-voting-reminder' // prefix → produces ID 'offchain-voting-reminder-75'
    );
  }

  async start(): Promise<void> {
    await this.initPromise;
    this.trigger.start({ status: this.proposalStatus });
    this.offchainProposalTrigger.start({ status: ['active', 'pending'] });
    this.offchainProposalFinishedTrigger.start();
    this.votingPowerTrigger.start();
    this.proposalFinishedTrigger.start();
    this.voteConfirmationTrigger.start();
    this.offchainVoteCastTrigger.start();

    // Start voting reminder triggers with their respective configurations
    this.votingReminderTrigger30.start();
    this.votingReminderTrigger60.start();
    this.votingReminderTrigger90.start();
    this.offchainVotingReminderTrigger75.start();
    
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
    if (this.offchainVoteCastTrigger) {
      this.offchainVoteCastTrigger.reset(initialTimestamp);
    }
    if (this.offchainProposalTrigger) {
      this.offchainProposalTrigger.reset(initialTimestamp);
    }
    if (this.offchainProposalFinishedTrigger) {
      this.offchainProposalFinishedTrigger.reset(initialTimestamp);
    }
    if (this.votingReminderTrigger30) {
      this.votingReminderTrigger30.stop();
    }
    if (this.votingReminderTrigger60) {
      this.votingReminderTrigger60.stop();
    }
    if (this.votingReminderTrigger90) {
      this.votingReminderTrigger90.stop();
    }
    if (this.offchainVotingReminderTrigger75) {
      this.offchainVotingReminderTrigger75.stop();
    }
  }

  async stop(): Promise<void> {
    await this.trigger.stop();
    await this.offchainProposalTrigger.stop();
    await this.offchainProposalFinishedTrigger.stop();
    await this.votingPowerTrigger.stop();
    await this.proposalFinishedTrigger.stop();
    await this.voteConfirmationTrigger.stop();
    await this.offchainVoteCastTrigger.stop();
    await this.votingReminderTrigger30.stop();
    await this.votingReminderTrigger60.stop();
    await this.votingReminderTrigger90.stop();
    await this.offchainVotingReminderTrigger75.stop();
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
