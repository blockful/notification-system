import { RabbitMQConnection, RabbitMQConsumer, RabbitMQMessage } from '@notification-system/rabbitmq-client';
import { NotificationPayload } from '../interfaces/notification.interface';
import { BotServiceInterface } from '../interfaces/bot-service.interface';

/**
 * Generic service to consume notification messages from RabbitMQ Topic Exchange
 * Works with any channel (Telegram, Slack, Discord, etc.) by using parameterized configuration
 */
export class RabbitMQNotificationConsumerService<T extends BotServiceInterface> {
  private static readonly EXCHANGE_NAME = 'notifications.exchange';

  private constructor(
    private readonly connection: RabbitMQConnection,
    private readonly consumer: RabbitMQConsumer,
    private readonly botService: T,
    private readonly channel: string
  ) {}

  /**
   * Creates a notification consumer for a specific channel
   * @param rabbitmqUrl The RabbitMQ connection URL
   * @param botService The bot service to handle notifications (any service implementing BotServiceInterface)
   * @param channel The channel name (e.g., 'telegram', 'slack', 'discord')
   */
  static async create<T extends BotServiceInterface>(
    rabbitmqUrl: string,
    botService: T,
    channel: string
  ): Promise<RabbitMQNotificationConsumerService<T>> {
    const connection = new RabbitMQConnection(rabbitmqUrl);
    await connection.connect();

    // Channel-specific configuration
    const queueName = `${channel}-consumer-queue`;
    const bindingPattern = `notifications.${channel}.*`;

    const consumer = await RabbitMQConsumer.create(connection, queueName);

    const service = new RabbitMQNotificationConsumerService(
      connection,
      consumer,
      botService,
      channel
    );

    await consumer.consumeFromTopic(
      RabbitMQNotificationConsumerService.EXCHANGE_NAME,
      bindingPattern,
      async (message: RabbitMQMessage<NotificationPayload>) => {
        await service.processNotification(message);
      }
    );

    console.log(`✅ ${channel.charAt(0).toUpperCase() + channel.slice(1)} consumer connected and listening on pattern: ${bindingPattern}`);

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
    // Validate message type
    if (message.type !== 'NOTIFICATION_EVENT') {
      console.log(`[${this.channel}] Skipping non-notification message type: ${message.type}`);
      return;
    }

    const payload = message.payload;

    // Validate payload structure
    if (!payload || !payload.userId || !payload.message) {
      console.error(`[${this.channel}] Invalid notification payload:`, payload);
      return;
    }

    // Validate channel matches
    if (payload.channel !== this.channel) {
      console.error(`[${this.channel}] Channel mismatch. Expected ${this.channel}, got ${payload.channel}`);
      return;
    }

    // Send notification using the bot service
    await this.botService.sendNotification(payload);
    console.log(`[${this.channel}] Notification sent successfully to user ${payload.userId}`);
  }
}