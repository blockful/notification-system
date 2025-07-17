import axios from 'axios';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { RabbitMQConsumerService } from './services/rabbitmq-consumer.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { RabbitMQNotificationService } from './services/notification/rabbitmq-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';
import { VotingPowerTriggerHandler } from './services/triggers/voting-power-trigger.service';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';

export class App {
  private rabbitMQConsumerService!: RabbitMQConsumerService;
  private rabbitmqConnection!: RabbitMQConnection;
  private isCreated = false;

  constructor(private subscriptionServerUrl: string, private rabbitmqUrl: string) {}

  private async setupServices(): Promise<void> {
    if (this.isCreated) return;

    const subscriptionAxiosClient = axios.create({
      baseURL: this.subscriptionServerUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const subscriptionClient = new SubscriptionClient(subscriptionAxiosClient);
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