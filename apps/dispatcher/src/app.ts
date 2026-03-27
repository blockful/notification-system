import axios from 'axios';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { RabbitMQConsumerService } from './services/rabbitmq-consumer.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { RabbitMQNotificationService } from './services/notification/rabbitmq-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';
import { NewOffchainProposalTriggerHandler } from './services/triggers/new-offchain-proposal-trigger.service';
import { VotingPowerTriggerHandler } from './services/triggers/voting-power-trigger.service';
import { ProposalFinishedTriggerHandler } from './services/triggers/proposal-finished-trigger.service';
import { NonVotingHandler } from './services/triggers/non-voting-handler.service';
import { VoteConfirmationTriggerHandler } from './services/triggers/vote-confirmation-trigger.service';
import { OffchainVoteCastTriggerHandler } from './services/triggers/offchain-vote-cast-trigger.service';
import { VotingReminderTriggerHandler } from './services/triggers/voting-reminder-trigger.service';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { NotificationTypeId } from '@notification-system/messages';

export class App {
  private rabbitMQConsumerService!: RabbitMQConsumerService;
  private rabbitmqConnection!: RabbitMQConnection;
  private publisher!: RabbitMQPublisher;
  private isCreated = false;

  constructor(
    private subscriptionServerUrl: string, 
    private rabbitmqUrl: string,
    private anticaptureGraphqlEndpoint: string,
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
    const subscriptionClient = new SubscriptionClient(subscriptionAxiosClient);
    
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
    const anticaptureClient = new AnticaptureClient(anticaptureAxiosClient);
    
    this.rabbitmqConnection = new RabbitMQConnection(this.rabbitmqUrl);
    await this.rabbitmqConnection.connect();
    this.publisher = await RabbitMQPublisher.create(this.rabbitmqConnection);
    const notificationFactory = new NotificationClientFactory();
    notificationFactory.addClient('telegram', new RabbitMQNotificationService(this.publisher));
    notificationFactory.addClient('slack', new RabbitMQNotificationService(this.publisher));
    const triggerProcessorService = new TriggerProcessorService();

    triggerProcessorService.addHandler(
      NotificationTypeId.NewProposal,
      new NewProposalTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient)
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.NewOffchainProposal,
      new NewOffchainProposalTriggerHandler(subscriptionClient, notificationFactory)
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.VotingPowerChanged,
      new VotingPowerTriggerHandler(subscriptionClient, notificationFactory)
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.ProposalFinished,
      new ProposalFinishedTriggerHandler(subscriptionClient, notificationFactory)
    );

    // Add second handler for proposal-finished to process non-voting addresses
    triggerProcessorService.addHandler(
      NotificationTypeId.ProposalFinished,
      new NonVotingHandler(subscriptionClient, notificationFactory, anticaptureClient)
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.VoteConfirmation,
      new VoteConfirmationTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient)
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.OffchainVoteCast,
      new OffchainVoteCastTriggerHandler(subscriptionClient, notificationFactory)
    );

    triggerProcessorService.addHandler(
      NotificationTypeId.VotingReminder30,
      new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient)
    );
    triggerProcessorService.addHandler(
      NotificationTypeId.VotingReminder60,
      new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient)
    );
    triggerProcessorService.addHandler(
      NotificationTypeId.VotingReminder90,
      new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient)
    );

    this.rabbitMQConsumerService = new RabbitMQConsumerService(this.rabbitmqUrl, triggerProcessorService);
    this.isCreated = true;
  }

  async start(): Promise<void> {
    await this.setupServices();
    await this.rabbitMQConsumerService?.start();
    console.log('Dispatcher service running!');
  }

  async stop(): Promise<void> {
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