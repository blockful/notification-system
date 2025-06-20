import axios from 'axios';
import { TriggerProcessorService } from './services/trigger-processor.service';
import { RabbitMQConsumerService } from './services/rabbitmq-consumer.service';
import { SubscriptionClient } from './services/subscription-client.service';
import { NotificationClientFactory } from './services/notification/notification-factory.service';
import { TelegramNotificationClient } from './services/notification/telegram-notification.service';
import { NewProposalTriggerHandler } from './services/triggers/new-proposal-trigger.service';

export class App {
  private rabbitMQConsumerService: RabbitMQConsumerService | null = null;

  constructor(subscriptionServerUrl: string, telegramConsumerUrl: string, rabbitmqUrl: string) {
    this.setupServices(subscriptionServerUrl, telegramConsumerUrl, rabbitmqUrl);
  }

  private setupServices(subscriptionServerUrl: string, telegramConsumerUrl: string, rabbitmqUrl: string): void {
    // Configure services
    const subscriptionAxiosClient = axios.create({
      baseURL: subscriptionServerUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const subscriptionClient = new SubscriptionClient(subscriptionAxiosClient);
    const notificationFactory = new NotificationClientFactory();
    notificationFactory.addClient('telegram', new TelegramNotificationClient(telegramConsumerUrl));
    const triggerProcessorService = new TriggerProcessorService();

    // Register trigger handlers
    triggerProcessorService.addHandler(
      'new-proposal',
      new NewProposalTriggerHandler(subscriptionClient, notificationFactory)
    );

    // Setup RabbitMQ consumer
    this.rabbitMQConsumerService = new RabbitMQConsumerService(rabbitmqUrl, triggerProcessorService);
  }

  async start(): Promise<void> {
    // Start RabbitMQ consumer
    await this.rabbitMQConsumerService?.start();
    console.log('Dispatcher service running!');
  }

  async stop(): Promise<void> {
    // Stop RabbitMQ consumer
    await this.rabbitMQConsumerService?.stop();
  }
} 