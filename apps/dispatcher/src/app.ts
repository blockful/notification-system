import axios from 'axios';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { RabbitMQConsumerService } from './services/rabbitmq-consumer.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { RabbitMQNotificationService } from './services/notification/rabbitmq-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';
import { NewOffchainProposalTriggerHandler } from './services/triggers/new-offchain-proposal-trigger.service';
import { OffchainProposalFinishedTriggerHandler } from './services/triggers/offchain-proposal-finished-trigger.service';
import { VotingPowerTriggerHandler } from './services/triggers/voting-power-trigger.service';
import { ProposalFinishedTriggerHandler } from './services/triggers/proposal-finished-trigger.service';
import { NonVotingHandler } from './services/triggers/non-voting-handler.service';
import { VoteConfirmationTriggerHandler } from './services/triggers/vote-confirmation-trigger.service';
import { OffchainVoteCastTriggerHandler } from './services/triggers/offchain-vote-cast-trigger.service';
import { VotingReminderTriggerHandler } from './services/triggers/voting-reminder-trigger.service';
import { NonVotersSource } from './interfaces/voting-reminder.interface';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { NotificationTypeId, votingReminderMessages, offchainVotingReminderMessages } from '@notification-system/messages';
import { createLogger, wrapWithTracing } from '@anticapture/observability';
import { type FastifyInstance } from 'fastify';
import { startServer } from './server';

const logger = createLogger('dispatcher');

export class App {
  private rabbitMQConsumerService!: RabbitMQConsumerService;
  private rabbitmqConnection!: RabbitMQConnection;
  private publisher!: RabbitMQPublisher;
  private server!: FastifyInstance;
  private isCreated = false;

  constructor(
    private subscriptionServerUrl: string,
    private rabbitmqUrl: string,
    private anticaptureGraphqlEndpoint: string,
    private port: number,
    private anticaptureHttpClient?: any,
    private blockfulApiToken?: string
  ) {}

  private async setupServices(): Promise<void> {
    if (this.isCreated) return;

    const subscriptionAxiosClient = axios.create({
      baseURL: this.subscriptionServerUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const subscriptionClient = wrapWithTracing(new SubscriptionClient(subscriptionAxiosClient));
    
    // Setup AnticaptureClient - use provided client or create new one
    const anticaptureAxiosClient = this.anticaptureHttpClient || axios.create({
      baseURL: this.anticaptureGraphqlEndpoint,
      headers: {
        'Content-Type': 'application/json',
        ...(this.blockfulApiToken && {
          Authorization: `Bearer ${this.blockfulApiToken}`,
        }),
      },
    });
    const anticaptureClient = wrapWithTracing(new AnticaptureClient(anticaptureAxiosClient));
    
    this.rabbitmqConnection = new RabbitMQConnection(this.rabbitmqUrl);
    await this.rabbitmqConnection.connect();
    this.publisher = await RabbitMQPublisher.create(this.rabbitmqConnection);
    const notificationFactory = new NotificationClientFactory();
    notificationFactory.addClient('telegram', wrapWithTracing(new RabbitMQNotificationService(this.publisher)));
    notificationFactory.addClient('slack', wrapWithTracing(new RabbitMQNotificationService(this.publisher)));
    notificationFactory.addClient('webhook', wrapWithTracing(new RabbitMQNotificationService(this.publisher)));
    const triggerProcessorService = wrapWithTracing(new TriggerProcessorService(logger));

    triggerProcessorService.addHandler(
      NotificationTypeId.NewProposal,
      wrapWithTracing(new NewProposalTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.NewOffchainProposal,
      wrapWithTracing(new NewOffchainProposalTriggerHandler(subscriptionClient, notificationFactory))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.OffchainProposalFinished,
      wrapWithTracing(new OffchainProposalFinishedTriggerHandler(subscriptionClient, notificationFactory))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.VotingPowerChanged,
      wrapWithTracing(new VotingPowerTriggerHandler(subscriptionClient, notificationFactory))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.ProposalFinished,
      wrapWithTracing(new ProposalFinishedTriggerHandler(subscriptionClient, notificationFactory))
    );

    // Add second handler for proposal-finished to process non-voting addresses
    triggerProcessorService.addHandler(
      NotificationTypeId.ProposalFinished,
      wrapWithTracing(new NonVotingHandler(subscriptionClient, notificationFactory, anticaptureClient, logger))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.VoteConfirmation,
      wrapWithTracing(new VoteConfirmationTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, logger))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.OffchainVoteCast,
      wrapWithTracing(new OffchainVoteCastTriggerHandler(subscriptionClient, notificationFactory, logger))
    );

    const onchainNonVotersSource: NonVotersSource = {
      getNonVoters: (id, daoId, addrs) => anticaptureClient.getProposalNonVoters(id, daoId, addrs)
    };

    const offchainNonVotersSource: NonVotersSource = {
      getNonVoters: (id, _daoId, addrs) => anticaptureClient.getOffchainProposalNonVoters(id, addrs)
    };

    triggerProcessorService.addHandler(
      NotificationTypeId.VotingReminder30,
      wrapWithTracing(new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, onchainNonVotersSource, votingReminderMessages, 'voting-reminder', logger))
    );
    triggerProcessorService.addHandler(
      NotificationTypeId.VotingReminder60,
      wrapWithTracing(new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, onchainNonVotersSource, votingReminderMessages, 'voting-reminder', logger))
    );
    triggerProcessorService.addHandler(
      NotificationTypeId.VotingReminder90,
      wrapWithTracing(new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, onchainNonVotersSource, votingReminderMessages, 'voting-reminder', logger))
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.OffchainVotingReminder75,
      wrapWithTracing(new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, offchainNonVotersSource, offchainVotingReminderMessages, 'offchain-voting-reminder', logger))
    );

    this.rabbitMQConsumerService = wrapWithTracing(new RabbitMQConsumerService(this.rabbitmqUrl, triggerProcessorService));
    this.isCreated = true;
  }

  async start(): Promise<void> {
    await this.setupServices();
    this.server = await startServer(this.port);
    await this.rabbitMQConsumerService?.start();
    logger.info('dispatcher service running');
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }

    if (this.rabbitMQConsumerService) {
      await this.rabbitMQConsumerService.stop();
    }

    if (this.publisher) {
      await this.publisher.close();
    }

    if (this.rabbitmqConnection) {
      await this.rabbitmqConnection.close();
    }
  }
} 