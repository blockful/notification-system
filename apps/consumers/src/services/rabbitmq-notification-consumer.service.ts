import { RabbitMQConnection, RabbitMQConsumer, RabbitMQMessage } from '@notification-system/rabbitmq-client';
import { TelegramBotService } from './telegram-bot.service';

/**
 * Interface for the notification payload received from RabbitMQ
 */
interface NotificationPayload {
  userId: string;
  channelUserId: number;
  message: string;
}

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
    await this.consumer.close();
    await this.connection.close();
  }

  private async processNotification(message: RabbitMQMessage<NotificationPayload>): Promise<void> {
    if (message.type !== 'NOTIFICATION_EVENT') {
      return;
    }
    await this.telegramBotService.sendNotification({
      userId: message.payload.userId,
      channelUserId: message.payload.channelUserId,
      message: message.payload.message,
    });
  }
}