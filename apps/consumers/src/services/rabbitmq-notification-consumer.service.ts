import { RabbitMQConnection, RabbitMQConsumer, RabbitMQMessage } from '@notification-system/rabbitmq-client';
import { TelegramBotService } from './telegram-bot.service';
import { NotificationPayload } from '../interfaces/notification.interface';

/**
 * Service to consume notification messages from RabbitMQ and process them through TelegramBotService
 */
export class RabbitMQNotificationConsumerService {
  private constructor(
    private readonly connection: RabbitMQConnection,
    private readonly consumer: RabbitMQConsumer,
    private readonly telegramBotService: TelegramBotService
  ) {}

  static async create(
    rabbitmqUrl: string,
    telegramBotService: TelegramBotService
  ): Promise<RabbitMQNotificationConsumerService> {
    const connection = new RabbitMQConnection(rabbitmqUrl);
    await connection.connect();
    
    const consumer = await RabbitMQConsumer.create(connection, 'consumer-queue');
    
    const service = new RabbitMQNotificationConsumerService(
      connection, 
      consumer, 
      telegramBotService
    );

    await consumer.consume(async (message: RabbitMQMessage<NotificationPayload>) => {
      await service.processNotification(message);
    });

    return service;
  }

  async stop(): Promise<void> {
    if (this.consumer) {
      await this.consumer.close();
    }
    
    if (this.connection) {
      await this.connection.close();
    }
  }

  private async processNotification(message: RabbitMQMessage<NotificationPayload>): Promise<void> {
    if (message.type !== 'NOTIFICATION_EVENT') {
      return;
    }
    
    try {
      await this.telegramBotService.sendNotification(message.payload);
    } catch (error: any) {
      if (error?.response?.description === 'Bad Request: chat not found') {
        console.log('⚠️  Unable to send message to user:', message.payload.userId);
        return;
      }
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  }
}