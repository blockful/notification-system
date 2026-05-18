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
import { AnticaptureClient, OnchainProposalStatusListEnumKey } from '@notification-system/anticapture-client';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { createLogger, wrapWithTracing } from '@anticapture/observability';
import { type FastifyInstance } from 'fastify';
import { startServer } from './server';

const logger = createLogger('logic-system');

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
  private offchainVotingReminderTrigger50!: VotingReminderTrigger;
  private proposalStatus: OnchainProposalStatusListEnumKey;
  private rabbitMQConnection!: RabbitMQConnection;
  private rabbitMQPublisher!: RabbitMQPublisher;
  private server!: FastifyInstance;
  private initPromise: Promise<void>;

  constructor(
    triggerInterval: number,
    proposalStatus: OnchainProposalStatusListEnumKey,
    anticaptureBaseURL: string,
    rabbitmqUrl: string,
    private port: number,
    initialTimestamp?: string,
    anticaptureHeaders?: Record<string, string>
  ) {
    this.proposalStatus = proposalStatus;

    const anticaptureClient = wrapWithTracing(new AnticaptureClient({
      baseURL: anticaptureBaseURL,
      defaultHeaders: anticaptureHeaders,
    }));
    const proposalRepository = wrapWithTracing(new ProposalRepository(anticaptureClient));
    const offchainProposalRepository = wrapWithTracing(new OffchainProposalRepository(anticaptureClient));
    const votingPowerRepository = wrapWithTracing(new VotingPowerRepository(anticaptureClient));
    const thresholdRepository = wrapWithTracing(new ThresholdRepository(anticaptureClient, undefined, logger));
    const votesRepository = wrapWithTracing(new VotesRepository(anticaptureClient));
    const offchainVotesRepository = wrapWithTracing(new OffchainVotesRepository(anticaptureClient));

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
    const dispatcherService = wrapWithTracing(new RabbitMQDispatcherService(this.rabbitMQPublisher));

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
      triggerInterval,
      logger,
    );

    this.offchainVoteCastTrigger = new OffchainVoteCastTrigger(
      dispatcherService,
      offchainVotesRepository,
      triggerInterval,
      logger,
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

    this.offchainVotingReminderTrigger50 = new VotingReminderTrigger(
      dispatcherService,
      offchainProposalRepository,
      triggerInterval,
      50, // 50% threshold
      5,  // default window size
      'offchain-voting-reminder' // prefix → produces ID 'offchain-voting-reminder-50'
    );
  }

  async start(): Promise<void> {
    await this.initPromise;
    this.server = await startServer(this.port);
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
    this.offchainVotingReminderTrigger50.start();
    
    logger.info('logic-system running');
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
      this.votingReminderTrigger30.start();
    }
    if (this.votingReminderTrigger60) {
      this.votingReminderTrigger60.stop();
      this.votingReminderTrigger60.start();
    }
    if (this.votingReminderTrigger90) {
      this.votingReminderTrigger90.stop();
      this.votingReminderTrigger90.start();
    }
    if (this.offchainVotingReminderTrigger50) {
      this.offchainVotingReminderTrigger50.stop();
      this.offchainVotingReminderTrigger50.start();
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }

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
    await this.offchainVotingReminderTrigger50.stop();
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
