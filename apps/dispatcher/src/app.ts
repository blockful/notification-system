import axios from 'axios';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { RabbitMQConsumerService } from './services/rabbitmq-consumer.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { RabbitMQNotificationService } from './services/notification/rabbitmq-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';
import { RabbitMQConnection, RabbitMQPublisher } from '@notification-system/rabbitmq-client';

export interface DispatcherAppConfig {
  subscriptionServerUrl: string;
  rabbitmqUrl: string;
}

export class App {
  private rabbitMQConsumerService: RabbitMQConsumerService;
  private rabbitmqConnection: RabbitMQConnection;

  private constructor(
    rabbitMQConsumerService: RabbitMQConsumerService,
    rabbitmqConnection: RabbitMQConnection
  ) {
    this.rabbitMQConsumerService = rabbitMQConsumerService;
    this.rabbitmqConnection = rabbitmqConnection;
  }

  static async create(config: DispatcherAppConfig): Promise<App> {
    const subscriptionAxiosClient = axios.create({
      baseURL: config.subscriptionServerUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const subscriptionClient = new SubscriptionClient(subscriptionAxiosClient);
    const rabbitmqConnection = new RabbitMQConnection(config.rabbitmqUrl);
    await rabbitmqConnection.connect();
    const publisher = await RabbitMQPublisher.create(rabbitmqConnection);
    const notificationFactory = new NotificationClientFactory();
    notificationFactory.addClient('telegram', new RabbitMQNotificationService(publisher));
    const triggerProcessorService = new TriggerProcessorService();

    triggerProcessorService.addHandler(
      'new-proposal',
      new NewProposalTriggerHandler(subscriptionClient, notificationFactory)
    );

    const rabbitMQConsumerService = new RabbitMQConsumerService(config.rabbitmqUrl, triggerProcessorService);
    
    return new App(rabbitMQConsumerService, rabbitmqConnection);
  }

  async start(): Promise<void> {
    await this.rabbitMQConsumerService.start();
    console.log('Dispatcher service running!');
  }

  async stop(): Promise<void> {
    await this.rabbitMQConsumerService.stop();
    await this.rabbitmqConnection.close();
  }
} 