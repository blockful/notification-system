import axios from 'axios';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { RabbitMQConsumerService } from './services/rabbitmq-consumer.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { RabbitMQNotificationService } from './services/notification/rabbitmq-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';
import { VotingPowerTriggerHandler } from './services/triggers/voting-power-trigger.service';
import { ProposalFinishedTriggerHandler } from './services/triggers/proposal-finished-trigger.service';
import { NonVotingHandler } from './services/triggers/non-voting-handler.service';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';
import { AnticaptureClient } from '@notification-system/anticapture-client';

export class App {
  private rabbitMQConsumerService!: RabbitMQConsumerService;
  private rabbitmqConnection!: RabbitMQConnection;
  private isCreated = false;

  constructor(
    private subscriptionServerUrl: string, 
    private rabbitmqUrl: string,
    private anticaptureGraphqlEndpoint: string
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
    
    // Setup AnticaptureClient
    const anticaptureAxiosClient = axios.create({
      baseURL: this.anticaptureGraphqlEndpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const anticaptureClient = new AnticaptureClient(anticaptureAxiosClient);
    
    this.rabbitmqConnection = new RabbitMQConnection(this.rabbitmqUrl);
    await this.rabbitmqConnection.connect();
    const publisher = await RabbitMQPublisher.create(this.rabbitmqConnection);
    const notificationFactory = new NotificationClientFactory();
    notificationFactory.addClient('telegram', new RabbitMQNotificationService(publisher));
    const triggerProcessorService = new TriggerProcessorService();

    triggerProcessorService.addHandler(
      'new-proposal',
      new NewProposalTriggerHandler(subscriptionClient, notificationFactory)
    );

    triggerProcessorService.addHandler(
      'voting-power-changed',
      new VotingPowerTriggerHandler(subscriptionClient, notificationFactory)
    );

    triggerProcessorService.addHandler(
      'proposal-finished',
      new ProposalFinishedTriggerHandler(subscriptionClient, notificationFactory)
    );

    // Add second handler for proposal-finished to process non-voting addresses
    triggerProcessorService.addHandler(
      'proposal-finished',
      new NonVotingHandler(subscriptionClient, notificationFactory, anticaptureClient)
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
    await this.rabbitMQConsumerService?.stop();
    await this.rabbitmqConnection?.close();
  }
} 