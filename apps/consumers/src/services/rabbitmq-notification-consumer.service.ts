import { RabbitMQConnection, RabbitMQConsumer, RabbitMQMessage } from '@notification-system/rabbitmq-client';
import { NotificationPayload } from '../interfaces/notification.interface';
import { BotServiceInterface } from '../interfaces/bot-service.interface';
import { createLogger, type Logger } from '@anticapture/observability';

/**
 * Generic service to consume notification messages from RabbitMQ Topic Exchange
 * Works with any channel (Telegram, Slack, Discord, etc.) by using parameterized configuration
 */
export class RabbitMQNotificationConsumerService<T extends BotServiceInterface> {
  private static readonly EXCHANGE_NAME = 'notifications.exchange';
  private readonly logger: Logger;

  private constructor(
    private readonly connection: RabbitMQConnection,
    private readonly consumer: RabbitMQConsumer,
    private readonly botService: T,
    private readonly channel: string,
    logger: Logger,
  ) {
    this.logger = logger.child({ component: 'RabbitMQNotificationConsumerService', channel });
  }

  /**
   * Creates a notification consumer for a specific channel
   * @param rabbitmqUrl The RabbitMQ connection URL
   * @param botService The bot service to handle notifications (any service implementing BotServiceInterface)
   * @param channel The channel name (e.g., 'telegram', 'slack', 'discord')
   */
  static async create<T extends BotServiceInterface>(
    rabbitmqUrl: string,
    botService: T,
    channel: string,
    logger: Logger = createLogger('consumers'),
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
      channel,
      logger,
    );

    await consumer.consumeFromTopic(
      RabbitMQNotificationConsumerService.EXCHANGE_NAME,
      bindingPattern,
      async (message: RabbitMQMessage<NotificationPayload>) => {
        await service.processNotification(message);
      }
    );

    service.logger.info(
      { bindingPattern, event: 'consumer.connected' },
      'consumer connected and listening',
    );

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
      this.logger.debug(
        { messageType: message.type, event: 'notification.skipped_non_notification' },
        'skipping non-notification message type',
      );
      return;
    }

    const payload = message.payload;

    // Validate payload structure
    if (!payload || !payload.userId || !payload.message) {
      this.logger.error(
        { payload, event: 'notification.invalid_payload' },
        'invalid notification payload',
      );
      return;
    }

    // Validate channel matches
    if (payload.channel !== this.channel) {
      this.logger.error(
        { expected: this.channel, got: payload.channel, event: 'notification.channel_mismatch' },
        'channel mismatch',
      );
      return;
    }

    // Send notification using the bot service
    await this.botService.sendNotification(payload);
    this.logger.info(
      { userId: payload.userId, event: 'notification.sent' },
      'notification sent',
    );
  }
}